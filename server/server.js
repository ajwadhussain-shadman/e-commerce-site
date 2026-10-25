const dotenv = require("dotenv");
dotenv.config({ quiet: true });

const { createApp } = require("./api");

function parseOrigins() {
  const configured = (process.env.FRONTEND_ORIGINS || "http://localhost:3000")
    .split(",").map((origin) => origin.trim()).filter(Boolean);
  if (process.env.NODE_ENV === "production" && (!process.env.FRONTEND_ORIGINS || configured.some((origin) => origin.includes("localhost")))) {
    throw new Error("Set FRONTEND_ORIGINS to the exact production frontend origin(s) before starting in production.");
  }
  return configured;
}

async function ensureIndexes(db) {
  await db.collection("system").updateOne(
    { _id: "admin-role-mutation-lock" }, { $setOnInsert: { revision: 0 } }, { upsert: true },
  );
  try { await db.createCollection("roleAudit"); }
  catch (error) { if (error?.code !== 48 && error?.codeName !== "NamespaceExists") throw error; }
  try { await db.createCollection("reviews"); }
  catch (error) { if (error?.code !== 48 && error?.codeName !== "NamespaceExists") throw error; }
  try { await db.createCollection("coupons"); }
  catch (error) { if (error?.code !== 48 && error?.codeName !== "NamespaceExists") throw error; }
  try { await db.createCollection("discountRules"); }
  catch (error) { if (error?.code !== 48 && error?.codeName !== "NamespaceExists") throw error; }
  const products = db.collection("products");
  const orders = db.collection("orders");
  const categories = db.collection("categories");
  const reviews = db.collection("reviews");
  const coupons = db.collection("coupons");
  const discountRules = db.collection("discountRules");
  await coupons.createIndex({ code: 1 }, { unique: true }).catch(() => {});
  await coupons.createIndex({ isActive: 1, isApproved: 1 }).catch(() => {});
  await discountRules.createIndex({ targetType: 1, isActive: 1 }).catch(() => {});
  const duplicateSlug = await products.aggregate([
    { $match: { slug: { $type: "string", $ne: "" } } },
    { $group: { _id: "$slug", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1 },
  ]).hasNext();
  if (!duplicateSlug) await products.createIndex({ slug: 1 }, { unique: true });
  else console.warn("Skipped the unique product slug index because duplicate legacy slugs need manual review.");
  await products.createIndex({ category: 1 });
  await products.createIndex({ brand: 1 });
  const duplicateCategorySlug = await categories.aggregate([
    { $match: { slug: { $type: "string", $ne: "" } } },
    { $group: { _id: "$slug", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1 },
  ]).hasNext();
  if (!duplicateCategorySlug) await categories.createIndex({ slug: 1 }, { unique: true });
  else console.warn("Skipped the unique category slug index because duplicate legacy slugs need manual review.");
  const duplicateReview = await reviews.aggregate([
    { $group: { _id: { userId: "$userId", productId: "$productId" }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1 },
  ]).hasNext();
  if (!duplicateReview) await reviews.createIndex({ userId: 1, productId: 1 }, { unique: true });
  else console.warn("Skipped the unique customer review index because duplicate reviews need manual review.");
  await reviews.createIndex({ productId: 1, status: 1, createdAt: -1 });

  const duplicateOrderRef = await orders.aggregate([
    { $match: { orderReference: { $type: "string", $ne: "" } } },
    { $group: { _id: "$orderReference", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1 },
  ]).hasNext();
  if (!duplicateOrderRef) await orders.createIndex({ orderReference: 1 }, { unique: true });
  else console.warn("Skipped the unique order reference index because duplicate legacy references need manual review.");
  await orders.createIndex({ userId: 1, createdAt: -1 });
  await orders.createIndex({ status: 1 });
  const duplicateIdempotencyKey = await orders.aggregate([
    { $match: { idempotencyKey: { $type: "string", $ne: "" } } },
    { $group: { _id: "$idempotencyKey", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1 },
  ]).hasNext();
  if (!duplicateIdempotencyKey) {
    await orders.createIndex({ idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } });
  } else console.warn("Skipped the unique order request key index because duplicate legacy keys need manual review.");
}

async function startServer() {
  let mongo;
  let server;
  try {
    const frontendOrigins = parseOrigins();
    mongo = await import("./database.mjs");
    const { client, db } = await mongo.connectMongo();
    const [{ createAuth }, { toNodeHandler, fromNodeHeaders }] = await Promise.all([
      import("./better-auth.config.mjs"),
      import("better-auth/node"),
    ]);
    const auth = createAuth(db, client);
    await ensureIndexes(db);
    const app = createApp({
      db,
      client,
      frontendOrigins,
      authHandler: toNodeHandler(auth),
      getSession: (req) => auth.api.getSession({ headers: fromNodeHeaders(req.headers) }),
    });
    const port = Number(process.env.PORT || 5000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be a valid TCP port.");
    server = await new Promise((resolve, reject) => {
      const listener = app.listen(port, () => resolve(listener));
      listener.once("error", reject);
    });
    console.log(`Importora API and Better Auth listening on port ${port}; database initialized.`);

    const shutdown = async () => {
      server.close(async () => {
        await mongo.closeMongo().catch(() => {});
        process.exit(0);
      });
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  } catch (error) {
    console.error(`Importora API startup failed: ${error.message}`);
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongo?.closeMongo) await mongo.closeMongo().catch(() => {});
    process.exitCode = 1;
  }
}

if (process.env.NODE_ENV !== "test") startServer();

module.exports = { startServer, ensureIndexes, parseOrigins };
