const test = require("node:test");
const assert = require("node:assert/strict");
const { PassThrough } = require("node:stream");
const { createApp } = require("../api");

function collection(initial = []) {
  const documents = initial.map((item) => ({ ...item }));
  const matches = (doc, query = {}) => Object.entries(query).every(([key, val]) => {
    if (key === "$or") return val.some((branch) => matches(doc, branch));
    const fieldValues = key.split(".").reduce((values, segment) => values.flatMap((value) => Array.isArray(value) ? value.map((item) => item?.[segment]) : [value?.[segment]]), [doc]).filter((value) => value !== undefined);
    const fieldValue = fieldValues[0];
    if (val instanceof RegExp) return fieldValues.some((value) => val.test(String(value || "")));
    if (val && typeof val === "object") {
      if ("$ne" in val && fieldValues.some((item) => item === val.$ne)) return false;
      if ("$in" in val && !fieldValues.some((value) => val.$in.some((item) => String(item) === String(value)))) return false;
      if ("$gte" in val && !fieldValues.some((value) => value >= val.$gte)) return false;
      if ("$lt" in val && !fieldValues.some((value) => value < val.$lt)) return false;
      return true;
    }
    return fieldValues.some((value) => value === val);
  });
  return {
    documents,
    find(query = {}) {
      const result = documents.filter((doc) => matches(doc, query));
      let skip = 0; let limit = Infinity;
      const cursor = {
        sort() { return cursor; },
        limit(value) { limit = value; return cursor; },
        skip(value) { skip = value; return cursor; },
        project() { return cursor; },
        async toArray() { return result.slice(skip, skip + limit).map((doc) => structuredClone(doc)); },
        async countDocuments() { return result.length; },
      };
      return cursor;
    },
    async findOne(query = {}) {
      const found = documents.find((doc) => matches(doc, query));
      return found ? structuredClone(found) : null;
    },
    async countDocuments(query = {}) { return documents.filter((doc) => matches(doc, query)).length; },
    async distinct(field) { return [...new Set(documents.map((doc) => doc[field]).filter(Boolean))]; },
    async insertOne(doc) { const record = { ...doc, _id: `fake-${documents.length + 1}` }; documents.push(record); return { insertedId: record._id }; },
    async createIndex() { return "index_created"; },
    async updateOne(query, update, options = {}) {
      const doc = documents.find((candidate) => matches(candidate, query));
      if (!doc) {
        if (!options.upsert) return { matchedCount: 0, modifiedCount: 0 };
        const created = { _id: query._id, ...(update.$setOnInsert || {}) };
        Object.assign(created, update.$set || {});
        for (const [key, amount] of Object.entries(update.$inc || {})) created[key] = (created[key] || 0) + amount;
        documents.push(created);
        return { matchedCount: 0, modifiedCount: 0, upsertedCount: 1 };
      }
      Object.assign(doc, update.$set || {});
      for (const [key, change] of Object.entries(update.$addToSet || {})) {
        const additions = change && typeof change === "object" && "$each" in change ? change.$each : [change];
        const values = (doc[key] ||= []);
        for (const value of additions) if (!values.some((item) => item === value)) values.push(value);
      }
      for (const [key, amount] of Object.entries(update.$inc || {})) doc[key] = (doc[key] || 0) + amount;
      for (const [key, value] of Object.entries(update.$push || {})) (doc[key] ||= []).push(value);
      return { matchedCount: 1, modifiedCount: 1 };
    },
    async deleteOne(query = {}) {
      const index = documents.findIndex((doc) => matches(doc, query));
      if (index < 0) return { deletedCount: 0 };
      documents.splice(index, 1);
      return { deletedCount: 1 };
    },
    async findOneAndUpdate(query, update) {
      const doc = documents.find((item) => matches(item, query));
      if (!doc) return null;
      Object.assign(doc, update.$set);
      for (const [key, value] of Object.entries(update.$push || {})) (doc[key] ||= []).push(value);
      return { ...doc };
    },
  };
}

function makeDb({ products = [], orders = [], categories = [], users = [] } = {}) {
  const collections = { products: collection(products), orders: collection(orders), categories: collection(categories), user: collection(users.length ? users : [{ id: "admin-1", role: "admin", email: "admin@example.invalid" }]) };
  return { databaseName: "importora", collection(name) { return collections[name] ||= collection(); }, collections };
}

async function withServer(app, callback) {
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  try { await callback(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

function responseJson(response) { return response.json(); }

function testTransactionClient() {
  return { startSession() { return { async withTransaction(callback) { await callback(this); }, async endSession() {} }; } };
}

test("health and public product browsing stay available", async () => {
  const db = makeDb({ products: [{ id: "prod-1", slug: "item", name: "Imported item", price: 100, discountPrice: 80, category: "snacks" }] });
  const app = createApp({ db });
  await withServer(app, async (base) => {
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 200);
    assert.equal((await responseJson(health)).status, "ok");
    const products = await fetch(`${base}/api/products?category=snacks&minPrice=75&maxPrice=85`);
    assert.equal(products.status, 200);
    const result = await responseJson(products);
    assert.equal(result.count, 1);
    assert.equal(result.data[0].id, "prod-1");
  });
});

test("admin navigation role gate is visible only for the admin role", async () => {
  const { hasAdminRole } = await import("../../src/lib/auth-access.mjs");
  assert.equal(hasAdminRole({ role: "admin" }), true);
  assert.equal(hasAdminRole({ role: "customer" }), false);
  assert.equal(hasAdminRole({ role: "unexpected" }), false);
  assert.equal(hasAdminRole(null), false);
});

test("admin product and order routes reject unauthenticated and customer sessions", async () => {
  const app = createApp({ db: makeDb(), getSession: async (req) => req.headers.authorization === "Bearer customer" ? { user: { id: "customer-1", role: "customer" } } : null });
  await withServer(app, async (base) => {
    const anonymous = await fetch(`${base}/api/products`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    assert.equal(anonymous.status, 401);
    const customer = await fetch(`${base}/api/orders`, { headers: { authorization: "Bearer customer" } });
    assert.equal(customer.status, 403);
  });
});

test("all product mutations and administrative order routes require an admin session", async () => {
  const app = createApp({ db: makeDb(), getSession: async () => null });
  await withServer(app, async (base) => {
    const json = { "content-type": "application/json" };
    const checks = [
      fetch(`${base}/api/products`, { method: "POST", headers: json, body: "{}" }),
      fetch(`${base}/api/products/test-id`, { method: "PUT", headers: json, body: "{}" }),
      fetch(`${base}/api/products/test-id`, { method: "DELETE" }),
      fetch(`${base}/api/categories`, { method: "POST", headers: json, body: "{}" }),
      fetch(`${base}/api/categories/test-category`, { method: "PUT", headers: json, body: "{}" }),
      fetch(`${base}/api/categories/test-category`, { method: "DELETE" }),
      fetch(`${base}/api/customers`),
      fetch(`${base}/api/orders`),
      fetch(`${base}/api/orders/NOV-12345/status`, { method: "PATCH", headers: json, body: JSON.stringify({ status: "Cancelled" }) }),
    ];
    const responses = await Promise.all(checks);
    assert.deepEqual(responses.map((response) => response.status), [401, 401, 401, 401, 401, 401, 401, 401, 401]);
  });
});

test("category changes require an administrator and deletion refuses categories in use", async () => {
  const db = makeDb({
    categories: [{ _id: "category-1", id: "snacks", slug: "snacks", name: "Snacks", description: "Imported snacks", subcategories: [] }],
    products: [{ id: "prod-1", category: "snacks" }],
    users: [{ id: "admin-1", role: "admin" }],
  });
  const anonymousApp = createApp({ db });
  await withServer(anonymousApp, async (base) => {
    const denied = await fetch(`${base}/api/categories`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Drinks" }) });
    assert.equal(denied.status, 401);
  });
  const adminApp = createApp({ db, getSession: async () => ({ user: { id: "admin-1", role: "admin" } }) });
  await withServer(adminApp, async (base) => {
    const update = await fetch(`${base}/api/categories/snacks`, {
      method: "PUT", headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Pantry Snacks", description: "Imported snacks", subcategories: ["Bars"] }),
    });
    assert.equal(update.status, 200);
    const renameSlug = await fetch(`${base}/api/categories/snacks`, {
      method: "PUT", headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Pantry Snacks", slug: "pantry-snacks", subcategories: ["Bars"] }),
    });
    assert.equal(renameSlug.status, 409);
    const deletion = await fetch(`${base}/api/categories/snacks`, { method: "DELETE" });
    assert.equal(deletion.status, 409);
    assert.equal(db.collections.categories.documents.length, 1);
  });
});

test("category API derives subcategories from real product documents and keeps them parent-scoped", async () => {
  const db = makeDb({ products: [
    { id: "snack-1", category: "snacks", subcategory: "bars", isActive: true },
    { id: "snack-2", category: "snacks", subcategory: "cookies", isActive: true },
    { id: "snack-inactive", category: "snacks", subcategory: "inactive legacy value", isActive: false },
    { id: "noodle-1", category: "noodles", subcategory: "ramen", isActive: true },
    { id: "empty-category", category: "pantry", isActive: true },
  ] });
  const app = createApp({ db });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/api/categories`);
    assert.equal(response.status, 200);
    const categories = (await responseJson(response)).data;
    const bySlug = new Map(categories.map((category) => [category.slug, category]));
    assert.deepEqual(bySlug.get("snacks").subcategories, ["bars", "cookies", "inactive legacy value"].sort((a, b) => a.localeCompare(b)));
    assert.deepEqual(bySlug.get("noodles").subcategories, ["ramen"]);
    assert.deepEqual(bySlug.get("pantry").subcategories, []);
  });
});

test("category seed adds only catalog-backed subcategories and is safe to rerun", async () => {
  const { seedCategorySubcategories } = await import("../scripts/seed-categories.mjs");
  const db = makeDb({
    products: [
      { category: "chocolates-snacks", subcategory: "KitKat & Chocolate Bars" },
      { category: "chocolates-snacks", subcategory: "Biscuits & Cookies" },
      { category: "personal-care", subcategory: "Body Wash & Shower Gels" },
    ],
    categories: [{ _id: "existing-category", slug: "chocolates-snacks", name: "Catalog Chocolates", description: "Keep me", subcategories: ["Existing curated option", "Biscuits & Cookies"] }],
  });

  const first = await seedCategorySubcategories(db, new Date("2026-01-01T00:00:00Z"));
  const chocolate = db.collections.categories.documents.find((category) => category.slug === "chocolates-snacks");
  assert.equal(chocolate.name, "Catalog Chocolates");
  assert.equal(chocolate.description, "Keep me");
  assert.deepEqual(chocolate.subcategories, ["Existing curated option", "Biscuits & Cookies", "KitKat & Chocolate Bars"]);
  assert.equal(db.collections.categories.documents.length, 2);
  assert.deepEqual(first, { created: 1, updated: 1, unchanged: 0, skipped: 0, subcategoriesAdded: 2 });

  const second = await seedCategorySubcategories(db, new Date("2026-01-02T00:00:00Z"));
  assert.equal(db.collections.categories.documents.length, 2);
  assert.equal(second.created, 0);
  assert.equal(second.updated, 0);
  assert.equal(second.unchanged, 2);
});

test("category seed refuses to operate on any database other than importora", async () => {
  const { seedCategorySubcategories } = await import("../scripts/seed-categories.mjs");
  const db = makeDb();
  db.databaseName = "production-other";
  await assert.rejects(seedCategorySubcategories(db), /must be importora/);
});

test("product creation accepts only subcategories belonging to its selected parent and persists the selection", async () => {
  const db = makeDb({
    products: [{ id: "existing-snack", category: "snacks", subcategory: "bars", isActive: true }],
    users: [{ id: "admin-1", role: "admin" }],
  });
  const app = createApp({ db, getSession: async () => ({ user: { id: "admin-1" } }) });
  await withServer(app, async (base) => {
    const create = (category, subcategory, name) => fetch(`${base}/api/products`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, brand: "Test", category, subcategory, price: 100, stock: 2, images: ["https://example.com/product.png"], shortDescription: "Short", fullDescription: "Full" }),
    });
    const wrongParent = await create("snacks", "ramen", "Invalid parent child");
    assert.equal(wrongParent.status, 400);
    assert.equal(db.collections.products.documents.length, 1);
    const valid = await create("snacks", "bars", "Valid snack");
    assert.equal(valid.status, 201);
    const saved = db.collections.products.documents.find((product) => product.slug === "valid-snack");
    assert.equal(saved.category, "snacks");
    assert.equal(saved.subcategory, "bars");
  });
});

test("product creation reports exactly which required fields are missing", async () => {
  const app = createApp({ db: makeDb(), getSession: async () => ({ user: { id: "admin-1" } }) });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/api/products`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Incomplete", brand: "Brand" }),
    });
    assert.equal(response.status, 400);
    const result = await responseJson(response);
    assert.equal(result.message, "Required product fields are missing: category, subcategory, shortDescription, fullDescription");
  });
});

test("admin can configure subcategories on an existing product-backed category with no category document", async () => {
  const db = makeDb({
    products: [{ id: "legacy-category-product", category: "pantry", subcategory: "tea", isActive: true }],
    users: [{ id: "admin-1", role: "admin" }],
  });
  const app = createApp({ db, getSession: async () => ({ user: { id: "admin-1" } }) });
  await withServer(app, async (base) => {
    const before = await responseJson(await fetch(`${base}/api/categories`));
    assert.deepEqual(before.data[0].subcategories, ["tea"]);
    const update = await fetch(`${base}/api/categories/pantry`, {
      method: "PUT", headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Pantry", slug: "pantry", description: "", image: "", banner: "", subcategories: ["tea", "coffee"] }),
    });
    assert.equal(update.status, 200);
    assert.deepEqual(db.collections.categories.documents[0].subcategories, ["tea", "coffee"]);
    const after = await responseJson(await fetch(`${base}/api/categories`));
    assert.deepEqual(after.data[0].subcategories, ["tea", "coffee"]);
  });
});

test("public product routes hide inactive products while admin inventory includes them", async () => {
  const db = makeDb({ products: [
    { id: "active-1", slug: "active-item", name: "Active", isActive: true },
    { id: "inactive-1", slug: "inactive-item", name: "Inactive", isActive: false },
  ] });
  const adminApp = createApp({ db, getSession: async () => ({ user: { id: "admin-1", role: "admin" } }) });
  await withServer(adminApp, async (base) => {
    const publicList = await fetch(`${base}/api/products`);
    assert.deepEqual((await responseJson(publicList)).data.map((product) => product.id), ["active-1"]);
    const adminList = await fetch(`${base}/api/admin/products`);
    assert.deepEqual((await responseJson(adminList)).data.map((product) => product.id), ["active-1", "inactive-1"]);
  });
});

test("admin customer endpoint returns sanitized customer records with order totals", async () => {
  const db = makeDb({
    users: [{ id: "customer-1", name: "Customer", email: "customer@example.invalid", phone: "01712345678", password: "must-not-leak", role: "customer" }, { id: "admin-1", role: "admin" }],
    orders: [{ userId: "customer-1", total: 1200, status: "Delivered" }, { userId: "customer-1", total: 800, status: "Pending" }],
  });
  const app = createApp({ db, getSession: async () => ({ user: { id: "admin-1", role: "admin" } }) });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/api/customers`);
    assert.equal(response.status, 200);
    const customer = (await responseJson(response)).data[0];
    assert.equal(customer.totalOrders, 2);
    assert.equal(customer.totalSpend, 1200);
    assert.equal("password" in customer, false);
  });
});

test("an administrator can create a validated product through the protected API", async () => {
  const db = makeDb({ categories: [{ name: "Snacks", slug: "snacks", subcategories: ["bars"] }], users: [{ id: "admin-1", role: "admin" }] });
  const app = createApp({ db, getSession: async () => ({ user: { id: "admin-1", role: "admin" } }) });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/api/products`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Test item", brand: "Test", category: "snacks", subcategory: "bars", price: 100, stock: 5, images: ["https://example.com/image.jpg"], shortDescription: "Short", fullDescription: "Full" }),
    });
    assert.equal(response.status, 201);
    assert.equal((await responseJson(response)).data.slug, "test-item");
  });
});

test("product create ignores client rating fields and admin products support server pagination", async () => {
  const db = makeDb({ categories: [{ name: "Snacks", slug: "snacks", subcategories: ["bars"] }], users: [{ id: "admin-1", role: "admin" }] });
  const app = createApp({ db, getSession: async () => ({ user: { id: "admin-1" } }) });
  await withServer(app, async (base) => {
    const created = await fetch(`${base}/api/products`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Rating-free product", brand: "Test", category: "snacks", subcategory: "bars", price: 100, stock: 5, images: ["https://example.com/item.png"], shortDescription: "Short description", fullDescription: "Detailed description", rating: 5, reviewCount: 99 }) });
    assert.equal(created.status, 201);
    const product = (await responseJson(created)).data;
    assert.equal(product.rating, 0);
    assert.equal(product.reviewCount, 0);
    assert.equal("id" in db.collections.products.documents[0], false);
    const paged = await fetch(`${base}/api/admin/products?page=1&limit=1&search=rating-free`);
    const pageData = await responseJson(paged);
    assert.equal(pageData.total, 1);
    assert.equal(pageData.data.length, 1);
    const publicSearch = await fetch(`${base}/api/products?search=rating-free`);
    assert.equal((await responseJson(publicSearch)).count, 1);
  });
});

test("customer reviews start pending, only approved reviews are public, and moderation is admin-only", async () => {
  const db = makeDb({
    products: [{ id: "prod-1", slug: "test-product", name: "Test product", isActive: true }],
    users: [{ id: "customer-1", role: "customer" }, { id: "admin-1", role: "admin" }],
  });
  const customerApp = createApp({ db, getSession: async (req) => ({ user: { id: req.headers.authorization === "Bearer someone-else" ? "other-customer" : "customer-1", name: "Buyer" } }) });
  let reviewId;
  await withServer(customerApp, async (base) => {
    const submitted = await fetch(`${base}/api/reviews`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId: "prod-1", rating: 5, title: "Good", text: "A real review from a signed-in customer." }) });
    assert.equal(submitted.status, 201);
    const data = await responseJson(submitted);
    reviewId = data.data.id;
    assert.equal(data.data.status, "pending");
    const duplicate = await fetch(`${base}/api/reviews`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId: "prod-1", rating: 4, title: "Again", text: "A second review should be rejected." }) });
    assert.equal(duplicate.status, 409);
    const edited = await fetch(`${base}/api/reviews/${reviewId}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ rating: 4, title: "Updated", text: "I edited my pending customer review." }) });
    assert.equal(edited.status, 200);
    assert.equal((await responseJson(edited)).data.status, "pending");
    const foreignEdit = await fetch(`${base}/api/reviews/${reviewId}`, { method: "PUT", headers: { "content-type": "application/json", authorization: "Bearer someone-else" }, body: JSON.stringify({ rating: 4, title: "Other", text: "Someone else should not edit this." }) });
    assert.equal(foreignEdit.status, 404);
    assert.equal((await responseJson(await fetch(`${base}/api/products/test-product/reviews`))).total, 0);
    assert.equal((await fetch(`${base}/api/admin/reviews`)).status, 403);
  });
  const adminApp = createApp({ db, getSession: async () => ({ user: { id: "admin-1" } }) });
  await withServer(adminApp, async (base) => {
    const moderated = await fetch(`${base}/api/admin/reviews/${reviewId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "approved" }) });
    assert.equal(moderated.status, 200);
    const result = await responseJson(await fetch(`${base}/api/products/test-product/reviews`));
    assert.equal(result.total, 1);
    const product = await responseJson(await fetch(`${base}/api/products/test-product`));
    assert.equal(product.data.rating, 4);
    assert.equal(product.data.reviewCount, 1);
  });
});

test("dashboard metrics use real collections and exclude non-delivered COD value", async () => {
  const db = makeDb({
    products: [{ id: "p1", isActive: true, stock: 3 }, { id: "p2", isActive: false, stock: 1 }],
    categories: [{ slug: "snacks" }],
    orders: [{ orderReference: "NOV-1", status: "Delivered", total: 500 }, { orderReference: "NOV-2", status: "Pending", total: 900 }],
    users: [{ id: "customer-1", role: "customer" }, { id: "admin-1", role: "admin" }],
  });
  const app = createApp({ db, getSession: async () => ({ user: { id: "admin-1" } }) });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/api/admin/metrics`);
    assert.equal(response.status, 200);
    const metrics = (await responseJson(response)).data;
    assert.equal(metrics.activeProducts, 1);
    assert.equal(metrics.categories, 1);
    assert.equal(metrics.customers, 1);
    assert.equal(metrics.totalOrders, 2);
    assert.equal(metrics.pendingOrders, 1);
    assert.equal(metrics.deliveredCodOrderValue, 500);
    assert.equal(metrics.lowStock.length, 1);
  });
});

test("admin image upload and metrics endpoints reject anonymous and customer requests", async () => {
  const db = makeDb({ users: [{ id: "customer-1", role: "customer" }, { id: "admin-1", role: "admin" }] });
  const anonymous = createApp({ db });
  await withServer(anonymous, async (base) => {
    assert.equal((await fetch(`${base}/api/admin/images/upload`, { method: "POST", headers: { "content-type": "image/png" }, body: Buffer.from("not-an-image") })).status, 401);
    assert.equal((await fetch(`${base}/api/admin/metrics`)).status, 401);
  });
  const customer = createApp({ db, getSession: async () => ({ user: { id: "customer-1", role: "customer" } }) });
  await withServer(customer, async (base) => {
    assert.equal((await fetch(`${base}/api/admin/images/upload`, { method: "POST", headers: { "content-type": "image/png" }, body: Buffer.from("not-an-image") })).status, 403);
    assert.equal((await fetch(`${base}/api/admin/metrics`)).status, 403);
  });
});

test("image upload reports missing Cloudinary configuration without exposing credentials", async () => {
  const db = makeDb({ users: [{ id: "admin-1", role: "admin" }] });
  const keys = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
  const originalEnv = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
  try {
    const app = createApp({ db, getSession: async () => ({ user: { id: "admin-1" } }) });
    await withServer(app, async (base) => {
      const form = new FormData();
      form.append("images", new Blob([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0])], { type: "image/png" }), "valid.png");
      const response = await fetch(`${base}/api/admin/images/upload`, { method: "POST", body: form });
      assert.equal(response.status, 503);
      const body = await responseJson(response);
      assert.match(body.message, /not configured/);
      assert.equal(db.collections.products.documents.length, 0);
    });
  } finally {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("Cloudinary multipart image upload is admin-only and validates actual image bytes", async () => {
  const db = makeDb({ users: [{ id: "admin-1", role: "admin" }] });
  const originalEnv = Object.fromEntries(["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].map((key) => [key, process.env[key]]));
  process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
  process.env.CLOUDINARY_API_KEY = "test-api-key";
  process.env.CLOUDINARY_API_SECRET = "test-api-secret";
  const cloudinaryClient = {
    config() {},
    uploader: {
      upload_stream(options, callback) {
        const stream = new PassThrough();
        stream.on("finish", () => callback(null, {
          secure_url: `https://res.cloudinary.com/test/image/upload/${options.folder}/${options.public_id}.png`,
          public_id: `${options.folder}/${options.public_id}`,
        }));
        return stream;
      },
      async destroy() { return { result: "ok" }; },
    },
  };
  const app = createApp({ db, cloudinaryClient, getSession: async () => ({ user: { id: "admin-1" } }) });
  try {
    await withServer(app, async (base) => {
      const invalid = new FormData();
      invalid.append("images", new Blob(["not an image"], { type: "image/png" }), "fake.png");
      assert.equal((await fetch(`${base}/api/admin/images/upload`, { method: "POST", body: invalid })).status, 400);

      const valid = new FormData();
      valid.append("images", new Blob([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0])], { type: "image/png" }), "test.png");
      const response = await fetch(`${base}/api/admin/images/upload`, { method: "POST", body: valid });
      assert.equal(response.status, 201);
      const payload = await response.json();
      assert.equal(payload.count, 1);
      assert.match(payload.data[0].url, /^https:\/\/res\.cloudinary\.com\//);
      assert.match(payload.data[0].publicId, /^importora\/products\//);
    });
  } finally {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("product image cleanup deletes previous unused assets only after the database save", async () => {
  const oldPublicId = "importora/products/123e4567-e89b-12d3-a456-426614174000";
  const orderImagePublicId = "importora/products/123e4567-e89b-12d3-a456-426614174001";
  const db = makeDb({
    products: [{ _id: "product-db-1", id: "product-1", slug: "product-one", name: "Product", brand: "Brand", category: "snacks", subcategory: "bars", shortDescription: "Short", fullDescription: "Full", price: 100, stock: 2, images: ["https://res.cloudinary.com/demo/image/upload/old.png"], imageAssets: [{ publicId: oldPublicId, url: "https://res.cloudinary.com/demo/image/upload/old.png" }, { publicId: orderImagePublicId, url: `https://res.cloudinary.com/demo/image/upload/${orderImagePublicId}.png` }], isActive: true }],
    orders: [{ orderReference: "NOV-HIST", items: [{ image: `https://res.cloudinary.com/demo/image/upload/${orderImagePublicId}.png` }] }],
    users: [{ id: "admin-1", role: "admin" }],
  });
  const originalEnv = Object.fromEntries(["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].map((key) => [key, process.env[key]]));
  process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
  process.env.CLOUDINARY_API_KEY = "test-api-key";
  process.env.CLOUDINARY_API_SECRET = "test-api-secret";
  const destroyed = [];
  const cloudinaryClient = {
    config() {},
    uploader: { async destroy(publicId) { assert.deepEqual(db.collections.products.documents[0].imageAssets, []); destroyed.push(publicId); return { result: "ok" }; } },
  };
  try {
    const app = createApp({ db, cloudinaryClient, getSession: async () => ({ user: { id: "admin-1" } }) });
    await withServer(app, async (base) => {
      const saved = await fetch(`${base}/api/products/product-1`, {
        method: "PUT", headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Product", slug: "product-one", brand: "Brand", category: "snacks", subcategory: "bars", shortDescription: "Short", fullDescription: "Full", price: 100, stock: 2, images: ["https://example.com/new.png"], imageAssets: [], isActive: true }),
      });
      assert.equal(saved.status, 200);
      assert.deepEqual(destroyed, [oldPublicId]);
    });
  } finally {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("a still-rendered Cloudinary asset is never deleted when imageAssets is cleared", async () => {
  const publicId = "importora/products/123e4567-e89b-12d3-a456-426614174002";
  const url = `https://res.cloudinary.com/demo/image/upload/${publicId}.png`;
  const db = makeDb({
    products: [{ _id: "product-db-2", id: "product-2", slug: "product-two", name: "Product", brand: "Brand", category: "snacks", subcategory: "bars", shortDescription: "Short", fullDescription: "Full", price: 100, stock: 2, images: [url], imageAssets: [{ publicId, url }], isActive: true }],
    users: [{ id: "admin-1", role: "admin" }],
  });
  const originalEnv = Object.fromEntries(["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].map((key) => [key, process.env[key]]));
  process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
  process.env.CLOUDINARY_API_KEY = "test-api-key";
  process.env.CLOUDINARY_API_SECRET = "test-api-secret";
  const destroyed = [];
  const cloudinaryClient = { config() {}, uploader: { async destroy(id) { destroyed.push(id); return { result: "ok" }; } } };
  try {
    const app = createApp({ db, cloudinaryClient, getSession: async () => ({ user: { id: "admin-1" } }) });
    await withServer(app, async (base) => {
      const saved = await fetch(`${base}/api/products/product-2`, {
        method: "PUT", headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Product", slug: "product-two", brand: "Brand", category: "snacks", subcategory: "bars", shortDescription: "Short", fullDescription: "Full", price: 100, stock: 2, images: [url], imageAssets: [], isActive: true }),
      });
      assert.equal(saved.status, 200, await saved.clone().text());
      assert.deepEqual(destroyed, []);
      assert.deepEqual(db.collections.products.documents[0].imageAssets, [{ publicId, url }]);
    });
  } finally {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("product removal archives records referenced by order history", async () => {
  const db = makeDb({
    products: [{ id: "prod-archive", slug: "archived-item", name: "Archived item", isActive: true }],
    orders: [{ orderReference: "NOV-HISTORY", items: [{ id: "prod-archive", name: "Archived item" }] }],
    users: [{ id: "admin-1", role: "admin" }],
  });
  const app = createApp({ db, getSession: async () => ({ user: { id: "admin-1" } }) });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/api/products/prod-archive`, { method: "DELETE" });
    assert.equal(response.status, 200);
    assert.equal((await responseJson(response)).archived, true);
    assert.equal(db.collections.products.documents.length, 1);
    assert.equal(db.collections.products.documents[0].isActive, false);
  });
});

test("order creation rejects client totals and uses database price, with stock reservation", async () => {
  const db = makeDb({ products: [{ id: "prod-1", _id: "db-id-1", name: "Trusted item", price: 1000, discountPrice: 800, stock: 4, images: ["image.jpg"] }] });
  const app = createApp({ db });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/api/orders`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customer: { fullName: "Buyer", phone: "01712345678", district: "Dhaka", address: "Street" },
        items: [{ id: "prod-1", quantity: 2, price: 1 }],
        subtotal: 2, total: 2, shippingFee: 0, discount: 0, paymentMethod: "Cash on Delivery",
      }),
    });
    assert.equal(response.status, 201);
    const order = (await responseJson(response)).data;
    assert.equal(order.subtotal, 1600);
    assert.equal(order.total, 1720);
    assert.equal(order.items[0].price, 800);
    assert.match(order.id, /^NOV-[A-F0-9]{16}$/);
    assert.equal(db.collections.products.documents[0].stock, 2);
  });
});

test("a checkout retry with the same request key does not create a second order or reserve stock twice", async () => {
  const db = makeDb({ products: [{ id: "prod-1", _id: "db-id-1", name: "Trusted item", price: 100, stock: 3, images: ["image.jpg"] }] });
  const app = createApp({ db });
  await withServer(app, async (base) => {
    const payload = {
      idempotencyKey: "checkout-retry-key-123456789",
      customer: { fullName: "Buyer", phone: "01712345678", district: "Dhaka", address: "Street" },
      items: [{ id: "prod-1", quantity: 1 }],
    };
    const options = { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) };
    const first = await fetch(`${base}/api/orders`, options);
    const created = (await responseJson(first)).data;
    const retry = await fetch(`${base}/api/orders`, options);
    const repeated = (await responseJson(retry)).data;
    assert.equal(first.status, 201);
    assert.equal(retry.status, 200);
    assert.equal(repeated.id, created.id);
    assert.equal(db.collections.orders.documents.length, 1);
    assert.equal(db.collections.products.documents[0].stock, 2);
  });
});

test("order tracking requires exact phone verification and removes private customer fields", async () => {
  const db = makeDb({ orders: [{ orderReference: "NOV-12345", customer: { fullName: "Buyer", phone: "+880 1712 345678", email: "hidden@example.invalid", address: "private", notes: "private", district: "Dhaka" }, items: [], total: 50, status: "Pending", history: [] }] });
  const app = createApp({ db });
  await withServer(app, async (base) => {
    assert.equal((await fetch(`${base}/api/orders/track/NOV-12345?phone=01712345679`)).status, 404);
    const response = await fetch(`${base}/api/orders/track/NOV-12345?phone=01712345678`);
    assert.equal(response.status, 200);
    const result = (await responseJson(response)).data;
    assert.equal(result.customer.fullName, "Buyer");
    assert.equal("email" in result.customer, false);
    assert.equal("address" in result.customer, false);
  });
});

test("customer order list is scoped to the authenticated Better Auth user", async () => {
  const db = makeDb({ orders: [
    { orderReference: "NOV-11111", userId: "customer-1", createdAt: new Date() },
    { orderReference: "NOV-22222", userId: "customer-2", createdAt: new Date() },
  ] });
  const app = createApp({ db, getSession: async () => ({ user: { id: "customer-1", role: "customer" } }) });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/api/orders/mine`);
    assert.equal(response.status, 200);
    const result = (await responseJson(response)).data;
    assert.deepEqual(result.map((order) => order.id), ["NOV-11111"]);
  });
});

test("a customer cannot read another customer's receipt by changing its reference", async () => {
  const db = makeDb({ orders: [{ orderReference: "NOV-22222", userId: "customer-2" }] });
  const app = createApp({ db, getSession: async () => ({ user: { id: "customer-1", role: "customer" } }) });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/api/orders/receipt/NOV-22222`);
    assert.equal(response.status, 404);
  });
});

test("cancelling an order restores inventory only once", async () => {
  const db = makeDb({
    products: [{ id: "prod-1", _id: "db-id-1", stock: 2 }],
    orders: [{ orderReference: "NOV-12345", status: "Pending", inventoryReserved: true, createdAt: new Date(), items: [{ id: "prod-1", quantity: 2 }], history: [] }],
    users: [{ id: "admin-1", role: "admin" }],
  });
  const app = createApp({ db, getSession: async () => ({ user: { id: "admin-1", role: "admin" } }) });
  await withServer(app, async (base) => {
    const options = { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "Cancelled" }) };
    const first = await fetch(`${base}/api/orders/NOV-12345/status`, options);
    assert.equal(first.status, 200, await first.text());
    const second = await fetch(`${base}/api/orders/NOV-12345/status`, options);
    assert.equal(second.status, 200, await second.text());
    assert.equal(db.collections.products.documents[0].stock, 4);
  });
});

test("order validation rejects invalid quantities before database writes", async () => {
  const db = makeDb();
  const app = createApp({ db });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/api/orders`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ customer: { fullName: "Buyer", phone: "01712345678", district: "Dhaka", address: "Street" }, items: [{ id: "prod-1", quantity: 0 }] }),
    });
    assert.equal(response.status, 400);
    assert.equal(db.collections.orders.documents.length, 0);
  });
});

test("online payment methods are rejected without creating an order or reserving stock", async () => {
  const db = makeDb({ products: [{ id: "prod-1", _id: "db-id-1", name: "Trusted item", price: 100, stock: 3, images: ["image.jpg"] }] });
  const app = createApp({ db });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/api/orders`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customer: { fullName: "Buyer", phone: "01712345678", district: "Dhaka", address: "Street" },
        items: [{ id: "prod-1", quantity: 1 }], paymentMethod: "bKash",
      }),
    });
    assert.equal(response.status, 400);
    assert.equal(db.collections.orders.documents.length, 0);
    assert.equal(db.collections.products.documents[0].stock, 3);
  });
});

test("user management requires a database-backed admin and returns sanitized paginated records", async () => {
  const db = makeDb({ users: [
    { id: "customer-1", name: "Customer", email: "buyer@example.invalid", role: "unexpected", password: "never-return" },
    { id: "admin-1", name: "Admin", email: "admin@example.invalid", role: "admin", password: "never-return" },
  ] });
  const anonymous = createApp({ db });
  await withServer(anonymous, async (base) => assert.equal((await fetch(`${base}/api/admin/users`)).status, 401));
  const app = createApp({ db, getSession: async () => ({ user: { id: "admin-1", role: "admin" } }) });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/api/admin/users?search=buyer`, { headers: { authorization: "Bearer admin" } });
    assert.equal(response.status, 200);
    const body = await responseJson(response);
    assert.equal(body.total, 1);
    assert.equal(body.data[0].role, "customer", "unexpected persisted roles must be treated as customers");
    assert.equal("password" in body.data[0], false);
  });
});

test("customers cannot promote users, even if a stale or forged session claims admin", async () => {
  const db = makeDb({ users: [
    { id: "customer-1", role: "customer" }, { id: "target-1", role: "customer" },
  ] });
  const app = createApp({ db, getSession: async () => ({ user: { id: "customer-1", role: "admin" } }) });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/api/admin/users/target-1/role`, {
      method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ role: "admin" }),
    });
    assert.equal(response.status, 403);
    assert.equal(db.collections.user.documents[1].role, "customer");
  });
});

test("admins can change other roles, audit changes, and cannot remove the final admin", async () => {
  const db = makeDb({ users: [
    { id: "admin-1", role: "admin" }, { id: "admin-2", role: "admin" }, { id: "customer-1", role: "customer" },
  ] });
  const app = createApp({ db, client: testTransactionClient(), getSession: async () => ({ user: { id: "admin-1", role: "admin" } }) });
  await withServer(app, async (base) => {
    const change = (id, role) => fetch(`${base}/api/admin/users/${id}/role`, {
      method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ role }),
    });
    assert.equal((await change("customer-1", "admin")).status, 200);
    assert.equal(db.collections.user.documents[2].role, "admin");
    assert.equal((await change("admin-1", "customer")).status, 403, "an administrator cannot change their own role");
    assert.equal((await change("admin-2", "customer")).status, 200);
    assert.equal((await change("customer-1", "customer")).status, 200);
    assert.equal((await change("admin-1", "customer")).status, 409);
    assert.equal(db.collections.user.documents[0].role, "admin");
    assert.equal(db.collections.roleAudit.documents.length, 3);
    assert.deepEqual(Object.keys(db.collections.roleAudit.documents[0]).filter((key) => key.endsWith("Role")).sort(), ["fromRole", "toRole"]);
  });
});

test("a demoted administrator's existing session is rejected on the next admin request", async () => {
  const db = makeDb({ users: [{ id: "admin-1", role: "customer" }] });
  const app = createApp({ db, getSession: async () => ({ user: { id: "admin-1", role: "admin" } }) });
  await withServer(app, async (base) => assert.equal((await fetch(`${base}/api/orders`)).status, 403));
});

test("BDT formatting keeps whole taka whole and limits fractional values to two decimals", async () => {
  const { formatBDT, normalizeMoney, toMinorUnits } = await import("../../src/lib/currency.mjs");
  assert.equal(formatBDT(549), "৳549");
  assert.equal(formatBDT("549.00"), "৳549");
  assert.equal(formatBDT(549.01), "৳549.01");
  assert.equal(formatBDT(549.1), "৳549.1");
  assert.equal(formatBDT(1234.567), "৳1,234.57");
  assert.equal(formatBDT(null), "৳0");
  assert.equal(normalizeMoney(549.009), 549.01);
  assert.equal(toMinorUnits(549.01), 54901);
  const serverCurrency = require("../currency.cjs");
  assert.equal(serverCurrency.normalizeMoney(549), 549);
  assert.equal(serverCurrency.normalizeMoney(549.009), 549.01);
  assert.equal(serverCurrency.toMinorUnits(549.01), 54901);
  assert.equal(serverCurrency.fromMinorUnits(54901), 549.01);

  const { getPrimaryImage, getProductImages } = await import("../../src/lib/product-images.mjs");
  assert.deepEqual(getProductImages({ images: ["first.png", "second.png"] }), ["first.png", "second.png"]);
  assert.deepEqual(getProductImages({ image: "legacy.png" }), ["legacy.png"]);
  assert.deepEqual(getProductImages({ images: [], image: "legacy.png" }), ["legacy.png"]);
  assert.equal(getPrimaryImage({}), "");
  assert.equal(getPrimaryImage({ image: "legacy.png" }), "legacy.png");
});

test("a whole-taka price of 549 is stored, returned, and ordered without a stray decimal", async () => {
  const db = makeDb({ categories: [{ slug: "snacks", name: "Snacks", subcategories: ["bars"] }] });
  const app = createApp({ db, getSession: async () => ({ user: { id: "admin-1" } }) });
  await withServer(app, async (base) => {
    const payload = {
      name: "Precision item", slug: "precision-item", brand: "Test", category: "snacks", subcategory: "bars",
      price: 549, stock: 10, images: ["https://example.com/549.png"],
      shortDescription: "Short description", fullDescription: "Full description",
    };
    const created = await fetch(`${base}/api/products`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    assert.equal(created.status, 201, await created.clone().text());
    const createdProduct = (await created.json()).data;
    assert.equal(createdProduct.price, 549);
    assert.equal(createdProduct.primaryImage, "https://example.com/549.png");
    assert.equal(db.collections.products.documents[0].price, 549);

    const publicProduct = await responseJson(await fetch(`${base}/api/products/precision-item`));
    assert.equal(publicProduct.data.price, 549);

    db.collections.products.documents[0].id = "prod-549";
    const updated = await fetch(`${base}/api/products/prod-549`, {
      method: "PUT", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, price: 549 }),
    });
    assert.equal(updated.status, 200, await updated.clone().text());
    assert.equal((await updated.json()).data.price, 549);
    assert.equal(db.collections.products.documents[0].price, 549);

    const orderResponse = await fetch(`${base}/api/orders`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customer: { fullName: "Buyer", phone: "01712345678", district: "Dhaka", address: "Street" },
        items: [{ id: "prod-549", quantity: 1 }],
      }),
    });
    assert.equal(orderResponse.status, 201, await orderResponse.clone().text());
    const order = (await orderResponse.json()).data;
    assert.equal(order.items[0].price, 549);
    assert.equal(order.subtotal, 549);
    assert.equal(order.total, 669);
  });
});

test("fractional product prices keep at most two decimals and use paisa-exact order totals", async () => {
  const db = makeDb({
    categories: [{ slug: "snacks", name: "Snacks", subcategories: ["bars"] }],
    products: [{ id: "prod-frac", _id: "db-frac", slug: "fractional", name: "Fractional item", price: 549.01, stock: 10, images: ["https://example.com/frac.png"] }],
  });
  const app = createApp({ db, getSession: async () => ({ user: { id: "admin-1" } }) });
  await withServer(app, async (base) => {
    const normalizedCreate = await fetch(`${base}/api/products`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Rounded item", slug: "rounded-item", brand: "Test", category: "snacks", subcategory: "bars",
        price: 549.009, stock: 1, images: ["https://example.com/round.png"],
        shortDescription: "Short", fullDescription: "Full",
      }),
    });
    assert.equal(normalizedCreate.status, 201, await normalizedCreate.clone().text());
    assert.equal((await normalizedCreate.json()).data.price, 549.01);

    const orderResponse = await fetch(`${base}/api/orders`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customer: { fullName: "Buyer", phone: "01712345678", district: "Dhaka", address: "Street" },
        items: [{ id: "prod-frac", quantity: 2 }],
        couponCode: "IMPORT10",
      }),
    });
    assert.equal(orderResponse.status, 201, await orderResponse.clone().text());
    const order = (await orderResponse.json()).data;
    assert.equal(order.items[0].price, 549.01);
    assert.equal(order.subtotal, 1098.02);
    assert.equal(order.discount, 109.8);
    assert.equal(order.shippingFee, 120);
    assert.equal(order.total, 1108.22);
  });
});

test("legacy single-image products are exposed as an image array and remain editable", async () => {
  const legacy = {
    _id: "legacy-db-1", id: "legacy-1", slug: "legacy-item", name: "Legacy item", brand: "Test",
    category: "snacks", subcategory: "bars", price: 100, stock: 2,
    image: "https://example.com/legacy.jpg", shortDescription: "Short", fullDescription: "Full", isActive: true,
  };
  const db = makeDb({ products: [legacy], users: [{ id: "admin-1", role: "admin" }] });
  const app = createApp({ db, getSession: async () => ({ user: { id: "admin-1" } }) });
  await withServer(app, async (base) => {
    const fetched = await responseJson(await fetch(`${base}/api/products/legacy-item`));
    assert.deepEqual(fetched.data.images, ["https://example.com/legacy.jpg"]);
    assert.equal(fetched.data.primaryImage, "https://example.com/legacy.jpg");
    assert.equal(fetched.data.image, "https://example.com/legacy.jpg");

    const basePayload = {
      name: "Legacy item", brand: "Test", category: "snacks", subcategory: "bars", price: 120, stock: 2,
      shortDescription: "Short", fullDescription: "Full", image: "https://example.com/legacy.jpg",
    };
    const saved = await fetch(`${base}/api/products/legacy-1`, {
      method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(basePayload),
    });
    assert.equal(saved.status, 200, await saved.clone().text());
    assert.deepEqual(db.collections.products.documents[0].images, ["https://example.com/legacy.jpg"]);

    const removed = await fetch(`${base}/api/products/legacy-1`, {
      method: "PUT", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...basePayload, images: [] }),
    });
    assert.equal(removed.status, 400);
    assert.match((await responseJson(removed)).message, /at least one valid image is required/);
    assert.deepEqual(db.collections.products.documents[0].images, ["https://example.com/legacy.jpg"]);
  });
});

test("product creation requires at least one valid image and keeps imageAssets aligned with image order", async () => {
  const db = makeDb({ categories: [{ slug: "snacks", name: "Snacks", subcategories: ["bars"] }] });
  const app = createApp({ db, getSession: async () => ({ user: { id: "admin-1" } }) });
  const firstId = "importora/products/123e4567-e89b-12d3-a456-426614174000";
  const secondId = "importora/products/123e4567-e89b-12d3-a456-426614174001";
  const firstUrl = "https://res.cloudinary.com/demo/image/upload/first.png";
  const secondUrl = "https://res.cloudinary.com/demo/image/upload/second.png";
  const baseProduct = {
    name: "Gallery item", brand: "Test", category: "snacks", subcategory: "bars", price: 100, stock: 1,
    shortDescription: "Short", fullDescription: "Full",
  };
  await withServer(app, async (base) => {
    const missing = await fetch(`${base}/api/products`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...baseProduct, slug: "missing-image", images: [] }),
    });
    assert.equal(missing.status, 400);
    assert.match((await responseJson(missing)).message, /at least one valid image is required/);
    assert.equal(db.collections.products.documents.length, 0);

    const created = await fetch(`${base}/api/products`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...baseProduct, slug: "gallery-item", images: [firstUrl, secondUrl],
        imageAssets: [
          { publicId: secondId, url: secondUrl },
          { publicId: firstId, url: firstUrl },
          { publicId: secondId, url: secondUrl },
        ],
      }),
    });
    assert.equal(created.status, 201, await created.clone().text());
    const product = (await created.json()).data;
    assert.deepEqual(product.images, [firstUrl, secondUrl]);
    assert.deepEqual(product.imageAssets.map((asset) => asset.publicId), [firstId, secondId]);
    assert.equal(product.image, firstUrl);

    const invalidAsset = await fetch(`${base}/api/products`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...baseProduct, name: "Bad gallery", slug: "bad-gallery", images: [firstUrl],
        imageAssets: [{ publicId: secondId, url: secondUrl }],
      }),
    });
    assert.equal(invalidAsset.status, 400);
    assert.match((await responseJson(invalidAsset)).message, /Persistent product images are invalid/);
  });
});

test("partial Cloudinary upload failure removes assets that already uploaded", async () => {
  const db = makeDb({ users: [{ id: "admin-1", role: "admin" }] });
  const originalEnv = Object.fromEntries(["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].map((key) => [key, process.env[key]]));
  process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
  process.env.CLOUDINARY_API_KEY = "test-api-key";
  process.env.CLOUDINARY_API_SECRET = "test-api-secret";
  const destroyed = [];
  let uploadCount = 0;
  const cloudinaryClient = {
    config() {},
    uploader: {
      upload_stream(options, callback) {
        const stream = new PassThrough();
        stream.on("finish", () => {
          uploadCount += 1;
          if (uploadCount === 2) return callback(new Error("provider failure"));
          callback(null, {
            secure_url: `https://res.cloudinary.com/test/image/upload/${options.folder}/${options.public_id}.png`,
            public_id: `${options.folder}/${options.public_id}`,
          });
        });
        return stream;
      },
      async destroy(publicId) { destroyed.push(publicId); return { result: "ok" }; },
    },
  };
  try {
    const app = createApp({ db, cloudinaryClient, getSession: async () => ({ user: { id: "admin-1" } }) });
    await withServer(app, async (base) => {
      const form = new FormData();
      const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);
      form.append("images", new Blob([png], { type: "image/png" }), "first.png");
      form.append("images", new Blob([png], { type: "image/png" }), "second.png");
      const response = await fetch(`${base}/api/admin/images/upload`, { method: "POST", body: form });
      assert.equal(response.status, 502);
      assert.equal(destroyed.length, 1);
      assert.match(destroyed[0], /^importora\/products\//);
      assert.equal(db.collections.products.documents.length, 0);
    });
  } finally {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
