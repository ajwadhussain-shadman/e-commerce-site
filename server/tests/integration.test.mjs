import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import net from "node:net";
import { after, before, describe, test } from "node:test";
import { MongoClient } from "mongodb";
import { createRequire } from "node:module";
import { createAuth } from "../better-auth.config.mjs";

const require = createRequire(import.meta.url);
const { createApp } = require("../api.js");
const TEST_DATABASE_PATTERN = /^importora_test(?:_[a-z0-9][a-z0-9_-]*)?$/;

export function getSafeTestDatabaseName(testUri, productionUri = "") {
  if (!testUri) throw new Error("Set TEST_MONGODB_URI to a dedicated isolated database URI before running integration tests.");
  let testTarget;
  try {
    const parsed = new URL(testUri);
    if (!new Set(["mongodb:", "mongodb+srv:"]).has(parsed.protocol) || !parsed.hostname) throw new Error();
    testTarget = { host: parsed.hostname.toLowerCase(), database: decodeURIComponent(parsed.pathname.replace(/^\/+/, "")) };
  } catch {
    throw new Error("TEST_MONGODB_URI must be a valid MongoDB URI with an explicit database name.");
  }
  if (!TEST_DATABASE_PATTERN.test(testTarget.database)) {
    throw new Error("Integration tests only run against a database named importora_test or importora_test_<isolated-suffix>.");
  }
  if (productionUri) {
    let productionTarget;
    try {
      const parsed = new URL(productionUri);
      productionTarget = { host: parsed.hostname.toLowerCase(), database: "importora" };
    } catch {
      throw new Error("MONGODB_URI is malformed; refusing to run integration tests until the production target can be checked.");
    }
    if (testTarget.database === productionTarget.database || testUri === productionUri) {
      throw new Error("TEST_MONGODB_URI points to the production database; integration tests were refused.");
    }
  }
  return testTarget.database;
}

test("test database guard requires a dedicated importora_test database", () => {
  assert.throws(() => getSafeTestDatabaseName(""), /TEST_MONGODB_URI/);
  assert.throws(() => getSafeTestDatabaseName("mongodb://localhost/importora"), /only run against/);
  assert.throws(() => getSafeTestDatabaseName("mongodb://localhost/importora_test", "mongodb://localhost/importora_test"), /production database/);
  assert.throws(() => getSafeTestDatabaseName("mongodb://localhost/another_test_db"), /only run against/);
  assert.equal(getSafeTestDatabaseName("mongodb://localhost/importora_test_run1", "mongodb://localhost/importora"), "importora_test_run1");
});

const testUri = process.env.TEST_MONGODB_URI;
const skipReason = testUri ? false : "TEST_MONGODB_URI is not configured; isolated MongoDB integration flows were not run.";

describe("Better Auth and MongoDB checkout integration", { skip: skipReason }, () => {
  let client;
  let db;
  let server;
  let baseUrl;
  let runId;
  let testProductId;
  let idempotencyKey;
  const userIds = [];
  const testEmails = [];

  before(async () => {
    if (process.env.NODE_ENV === "production") throw new Error("Integration tests cannot run with NODE_ENV=production.");
    const databaseName = getSafeTestDatabaseName(testUri, process.env.MONGODB_URI || "");
    client = new MongoClient(testUri, { serverSelectionTimeoutMS: 8000 });
    await client.connect();
    db = client.db(databaseName);
    await db.command({ ping: 1 });
    await db.collection("system").updateOne({ _id: "admin-role-mutation-lock" }, { $setOnInsert: { revision: 0 } }, { upsert: true });
    try { await db.createCollection("roleAudit"); } catch (error) { if (error?.code !== 48 && error?.codeName !== "NamespaceExists") throw error; }

    runId = randomUUID().replaceAll("-", "");
    testProductId = `integration-${runId}`;
    idempotencyKey = `integration_${runId}`;

    const port = await reserveLocalPort();
    process.env.BETTER_AUTH_URL = `http://127.0.0.1:${port}`;
    process.env.BETTER_AUTH_SECRET = randomBytes(32).toString("base64url");
    process.env.FRONTEND_ORIGINS = "http://localhost:3000";
    const auth = createAuth(db, client);
    const { toNodeHandler, fromNodeHeaders } = await import("better-auth/node");
    const app = createApp({
      db,
      client,
      frontendOrigins: ["http://localhost:3000"],
      authHandler: toNodeHandler(auth),
      getSession: (req) => auth.api.getSession({ headers: fromNodeHeaders(req.headers) }),
    });
    server = await new Promise((resolve, reject) => {
      const listener = app.listen(port, "127.0.0.1", () => resolve(listener));
      listener.once("error", reject);
    });
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (db && runId) {
      const orders = db.collection("orders");
      await orders.deleteMany({ idempotencyKey }).catch(() => {});
      if (testProductId) await db.collection("products").deleteOne({ id: testProductId }).catch(() => {});
      if (userIds.length) {
        await db.collection("session").deleteMany({ userId: { $in: userIds } }).catch(() => {});
        await db.collection("account").deleteMany({ userId: { $in: userIds } }).catch(() => {});
        await db.collection("user").deleteMany({ id: { $in: userIds } }).catch(() => {});
        await db.collection("roleAudit").deleteMany({ $or: [{ actorUserId: { $in: userIds } }, { targetUserId: { $in: userIds } }] }).catch(() => {});
      }
      if (testEmails.length) {
        await db.collection("verification").deleteMany({ identifier: { $in: testEmails } }).catch(() => {});
        await db.collection("user").deleteMany({ email: { $in: testEmails } }).catch(() => {});
      }
    }
    await client?.close();
  });

  test("registration, login, logout, session persistence, COD transactions, ownership, and admin authorization", async (t) => {
    const customerEmail = `customer-${runId}@example.test`;
    const otherEmail = `other-${runId}@example.test`;
    const adminEmail = `admin-${runId}@example.test`;
    const password = `${randomBytes(24).toString("base64url")}Aa1!`;
    testEmails.push(customerEmail, otherEmail, adminEmail);

    const customerJar = new Map();
    const registration = await authRequest("/sign-up/email", { name: "Integration Customer", email: customerEmail, password, role: "admin" }, customerJar);
    assert.equal(registration.status, 200, "Better Auth registration should succeed");
    assert.equal(registration.allowOrigin, "http://localhost:3000", "credentialed auth responses should allow only the configured storefront origin");
    assert.equal(registration.allowCredentials, "true", "auth CORS should allow cookies");
    assert.match(registration.setCookies.join(";"), /httponly/i, "Better Auth session cookies should be HttpOnly");
    assert.match(registration.setCookies.join(";"), /samesite=lax/i, "same-site session cookies should use SameSite=Lax by default");
    const customer = registration.body.user;
    assert.ok(customer?.id, "registration should return a Better Auth user");
    userIds.push(customer.id);
    assert.equal(customer.role, "customer", "public registration must retain the customer role");
    const attemptedRoleUpdate = await authRequest("/update-user", { role: "admin" }, customerJar);
    assert.ok([200, 400].includes(attemptedRoleUpdate.status), "the Better Auth profile endpoint should either ignore or reject a non-input role field");
    assert.equal((await db.collection("user").findOne({ id: customer.id })).role, "customer", "users cannot update their own role through Better Auth");

    const initialSession = await authRequest("/get-session", undefined, customerJar, "GET");
    assert.equal(initialSession.status, 200);
    assert.equal(initialSession.body.user.id, customer.id, "registration should establish a session");

    const logout = await authRequest("/sign-out", {}, customerJar);
    assert.equal(logout.status, 200, "logout should succeed");
    const noSession = await authRequest("/get-session", undefined, customerJar, "GET");
    assert.ok(!noSession.body?.user, "logout should revoke the session");

    const login = await authRequest("/sign-in/email", { email: customerEmail, password }, customerJar);
    assert.equal(login.status, 200, "Better Auth login should succeed");
    const persistedSession = await authRequest("/get-session", undefined, customerJar, "GET");
    assert.equal(persistedSession.body.user.id, customer.id, "a separate request should recover the persisted session");
    assert.ok(await db.collection("session").findOne({ userId: customer.id }), "Better Auth session should be stored in the test database");

    await t.test("customer sessions cannot access admin APIs", async () => {
      const response = await apiRequest("/api/orders", customerJar);
      assert.equal(response.status, 403);
      const customerList = await apiRequest("/api/customers", customerJar);
      assert.equal(customerList.status, 403);
    });

    await db.collection("products").insertOne({
      id: testProductId,
      slug: testProductId,
      name: `Integration Product ${runId}`,
      price: 250,
      discountPrice: 175,
      stock: 5,
      isAvailable: true,
      images: [],
    });
    const orderPayload = {
      idempotencyKey,
      customer: { fullName: "Integration Customer", phone: "01700000001", district: "Dhaka", address: "Integration test address" },
      items: [{ id: testProductId, quantity: 2, price: 1 }],
      subtotal: 2,
      total: 2,
      paymentMethod: "Cash on Delivery",
    };
    const placed = await apiRequest("/api/orders", customerJar, { method: "POST", body: orderPayload });
    assert.equal(placed.status, 201, "checkout should create a COD order in a real MongoDB transaction");
    assert.equal(placed.body.data.subtotal, 350, "checkout should use the database discount price");
    assert.equal(placed.body.data.total, 470, "checkout should calculate Dhaka shipping on the server");
    assert.equal(placed.body.data.userId, undefined, "public order response must not expose its owner ID");
    const orderReference = placed.body.data.id;

    const storedProduct = await db.collection("products").findOne({ id: testProductId });
    assert.equal(storedProduct.stock, 3, "the transaction should reserve the requested stock");
    const repeated = await apiRequest("/api/orders", customerJar, { method: "POST", body: orderPayload });
    assert.equal(repeated.status, 200, "retry with the same idempotency key should return the original order");
    assert.equal(repeated.body.data.id, orderReference);
    assert.equal(await db.collection("orders").countDocuments({ idempotencyKey }), 1, "retry must not insert a second order");
    assert.equal((await db.collection("products").findOne({ id: testProductId })).stock, 3, "retry must not reserve stock twice");

    const otherJar = new Map();
    const otherRegistration = await authRequest("/sign-up/email", { name: "Other Integration Customer", email: otherEmail, password }, otherJar);
    assert.equal(otherRegistration.status, 200);
    userIds.push(otherRegistration.body.user.id);
    await authRequest("/sign-out", {}, otherJar);
    await authRequest("/sign-in/email", { email: otherEmail, password }, otherJar);
    const stolenReceipt = await apiRequest(`/api/orders/receipt/${encodeURIComponent(orderReference)}`, otherJar, { method: "GET" });
    assert.equal(stolenReceipt.status, 404, "another authenticated customer must not read this receipt");

    const adminJar = new Map();
    const adminRegistration = await authRequest("/sign-up/email", { name: "Integration Admin", email: adminEmail, password }, adminJar);
    assert.equal(adminRegistration.status, 200);
    const adminUserId = adminRegistration.body.user.id;
    userIds.push(adminUserId);
    await authRequest("/sign-out", {}, adminJar);
    const promoted = await db.collection("user").updateOne({ id: adminUserId }, { $set: { role: "admin" } });
    assert.equal(promoted.matchedCount, 1, "only the test-owned admin account should be promoted");
    const adminLogin = await authRequest("/sign-in/email", { email: adminEmail, password }, adminJar);
    assert.equal(adminLogin.status, 200);
    const adminOrders = await apiRequest("/api/orders", adminJar, { method: "GET" });
    assert.equal(adminOrders.status, 200, "a Better Auth session with a database-owned admin role should access admin APIs");
    assert.ok(adminOrders.body.data.some((order) => order.id === orderReference), "admin order listing should include the test order");
    const adminUserList = await apiRequest("/api/admin/users", adminJar, { method: "GET" });
    assert.equal(adminUserList.status, 200, "admins should be able to list sanitized user records");
    assert.ok(adminUserList.body.data.every((user) => !("password" in user)), "user management must not return credential fields");
    const promote = await apiRequest(`/api/admin/users/${encodeURIComponent(customer.id)}/role`, adminJar, { method: "PATCH", body: { role: "admin" } });
    assert.equal(promote.status, 200, "an administrator should be able to promote a test-owned customer");
    assert.equal((await db.collection("user").findOne({ id: customer.id })).role, "admin");
    const competingChanges = await Promise.all([
      apiRequest(`/api/admin/users/${encodeURIComponent(adminUserId)}/role`, customerJar, { method: "PATCH", body: { role: "customer" } }),
      apiRequest(`/api/admin/users/${encodeURIComponent(customer.id)}/role`, adminJar, { method: "PATCH", body: { role: "customer" } }),
    ]);
    assert.deepEqual(competingChanges.map((response) => response.status).sort(), [200, 403], "serialized concurrent demotions must preserve one admin and reject the stale actor");
    const adminRecords = await db.collection("user").find({ role: "admin" }, { projection: { id: 1 } }).toArray();
    assert.equal(adminRecords.length, 1, "concurrent role changes must never remove every administrator");
    const lastAdminId = adminRecords[0].id;
    const lastAdminJar = lastAdminId === customer.id ? customerJar : adminJar;
    const demotedJar = lastAdminId === customer.id ? adminJar : customerJar;
    const staleAdminRequest = await apiRequest("/api/orders", demotedJar, { method: "GET" });
    assert.equal(staleAdminRequest.status, 403, "the demoted user's existing session must lose admin access immediately");
    const finalAdminDemotion = await apiRequest(`/api/admin/users/${encodeURIComponent(lastAdminId)}/role`, lastAdminJar, { method: "PATCH", body: { role: "customer" } });
    assert.equal(finalAdminDemotion.status, 409, "the final test administrator cannot be demoted");

    const tracking = await apiRequest(`/api/orders/track/${encodeURIComponent(orderReference)}?phone=01700000001`, new Map(), { method: "GET" });
    assert.equal(tracking.status, 200, "guest order tracking should require and accept the matching phone");
    const wrongPhone = await apiRequest(`/api/orders/track/${encodeURIComponent(orderReference)}?phone=01700000002`, new Map(), { method: "GET" });
    assert.equal(wrongPhone.status, 404, "guest tracking must reject a mismatched phone");
  });

  async function authRequest(path, body, cookieJar, method = "POST") {
    const headers = { origin: "http://localhost:3000" };
    if (body !== undefined) headers["content-type"] = "application/json";
    const cookieHeader = [...cookieJar].map(([name, value]) => `${name}=${value}`).join("; ");
    if (cookieHeader) headers.cookie = cookieHeader;
    const response = await fetch(`${baseUrl}/api/auth${path}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    storeCookies(response.headers, cookieJar);
    const responseBody = await response.json().catch(() => null);
    return {
      status: response.status,
      body: responseBody,
      allowOrigin: response.headers.get("access-control-allow-origin"),
      allowCredentials: response.headers.get("access-control-allow-credentials"),
      setCookies: typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : [response.headers.get("set-cookie") || ""],
    };
  }

  async function apiRequest(path, cookieJar, { method = "GET", body } = {}) {
    const headers = { origin: "http://localhost:3000" };
    if (body !== undefined) headers["content-type"] = "application/json";
    const cookieHeader = [...cookieJar].map(([name, value]) => `${name}=${value}`).join("; ");
    if (cookieHeader) headers.cookie = cookieHeader;
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json().catch(() => null) };
  }
});

function storeCookies(headers, cookieJar) {
  const setCookies = typeof headers.getSetCookie === "function"
    ? headers.getSetCookie()
    : (headers.get("set-cookie") || "").split(/,(?=[^;,]+=)/);
  for (const cookie of setCookies) {
    const pair = cookie.split(";", 1)[0];
    const separator = pair.indexOf("=");
    if (separator > 0) cookieJar.set(pair.slice(0, separator).trim(), pair.slice(separator + 1).trim());
  }
}

async function reserveLocalPort() {
  const probe = net.createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", resolve);
  });
  const { port } = probe.address();
  await new Promise((resolve) => probe.close(resolve));
  return port;
}
