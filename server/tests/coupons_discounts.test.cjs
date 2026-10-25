const test = require("node:test");
const assert = require("node:assert/strict");
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
      if ("$gt" in val && !fieldValues.some((value) => value > val.$gt)) return false;
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
    async insertOne(doc) {
      const record = { ...doc, _id: `fake-${documents.length + 1}` };
      documents.push(record);
      return { insertedId: record._id };
    },
    async insertMany(docs) {
      for (const d of docs) {
        documents.push({ ...d, _id: `fake-${documents.length + 1}` });
      }
      return { insertedCount: docs.length };
    },
    async createIndex() { return "index_created"; },
    async updateOne(query, update) {
      const doc = documents.find((candidate) => matches(candidate, query));
      if (!doc) return { matchedCount: 0, modifiedCount: 0 };
      Object.assign(doc, update.$set || {});
      for (const [key, amount] of Object.entries(update.$inc || {})) doc[key] = (doc[key] || 0) + amount;
      return { matchedCount: 1, modifiedCount: 1 };
    },
    async updateMany(query, update) {
      const matching = documents.filter((candidate) => matches(candidate, query));
      for (const doc of matching) {
        Object.assign(doc, update.$set || {});
      }
      return { matchedCount: matching.length, modifiedCount: matching.length };
    },
    async deleteOne(query) {
      const index = documents.findIndex((doc) => matches(doc, query));
      if (index === -1) return { deletedCount: 0 };
      documents.splice(index, 1);
      return { deletedCount: 1 };
    },
  };
}

function mockDb(initial = {}) {
  const store = {
    products: collection(initial.products || []),
    categories: collection(initial.categories || []),
    orders: collection(initial.orders || []),
    user: collection(initial.user || []),
    reviews: collection(initial.reviews || []),
    coupons: collection(initial.coupons || []),
    discountRules: collection(initial.discountRules || []),
  };
  return { collection: (name) => store[name] || (store[name] = collection()) };
}

async function request(app, method, path, { body, session } = {}) {
  const server = app.listen(0);
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(session ? { "x-test-session": JSON.stringify(session) } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("promo codes: admin CRUD and customer approval enforcement", async () => {
  const adminUser = { id: "admin-1", role: "admin" };
  const customerUser = { id: "cust-1", role: "customer" };

  const db = mockDb({
    user: [{ id: "admin-1", role: "admin" }, { id: "cust-1", role: "customer" }],
    categories: [{ name: "Sweets", slug: "sweets", subcategories: ["Candy"] }],
    products: [
      {
        id: "prod-1",
        _id: "prod-1",
        name: "Imported Chocolate",
        slug: "imported-chocolate",
        brand: "BrandX",
        category: "sweets",
        subcategory: "Candy",
        price: 1000,
        stock: 50,
        images: ["/img/test.png"],
        isActive: true,
      },
    ],
  });

  const app = createApp({
    db,
    getSession: (req) => {
      const header = req.headers["x-test-session"];
      return header ? { user: JSON.parse(header) } : null;
    },
  });

  // 1. Admin creates a promo code "SAVE15" (15% off, pending approval initially)
  const createRes = await request(app, "POST", "/api/admin/coupons", {
    session: adminUser,
    body: {
      code: "SAVE15",
      description: "15% discount on all orders",
      discountType: "percent",
      discountValue: 15,
      minSpend: 500,
      isApproved: false, // Pending approval
      isActive: true,
    },
  });
  assert.equal(createRes.status, 201);
  assert.equal(createRes.data.data.code, "SAVE15");
  assert.equal(createRes.data.data.isApproved, false);

  // 2. Customer tries to validate "SAVE15" before approval -> should be rejected!
  const validateBefore = await request(app, "POST", "/api/coupons/validate", {
    body: { code: "SAVE15", subtotal: 1000 },
  });
  assert.equal(validateBefore.status, 400);
  assert.match(validateBefore.data.message, /pending approval/i);

  // 3. Customer tries to place an order with unapproved "SAVE15" -> rejected!
  const orderBefore = await request(app, "POST", "/api/orders", {
    session: customerUser,
    body: {
      items: [{ id: "prod-1", quantity: 1 }],
      shippingSpeed: "standard",
      couponCode: "SAVE15",
      customer: {
        fullName: "Test Customer",
        phone: "01711111111",
        district: "Dhaka",
        address: "Banani, Road 11",
      },
    },
  });
  assert.equal(orderBefore.status, 400);
  assert.match(orderBefore.data.message, /not approved/i);

  // 4. Admin approves the promo code
  const approveRes = await request(app, "PATCH", `/api/admin/coupons/${createRes.data.data.id}/approve`, {
    session: adminUser,
    body: { isApproved: true },
  });
  assert.equal(approveRes.status, 200);
  assert.equal(approveRes.data.isApproved, true);

  // 5. Customer validates approved "SAVE15" -> successfully gets 15% discount (150 on 1000)
  const validateAfter = await request(app, "POST", "/api/coupons/validate", {
    body: { code: "SAVE15", subtotal: 1000 },
  });
  assert.equal(validateAfter.status, 200);
  assert.equal(validateAfter.data.valid, true);
  assert.equal(validateAfter.data.discount, 150);

  // 6. Customer places order with approved promo code -> order succeeds with discount!
  const orderAfter = await request(app, "POST", "/api/orders", {
    session: customerUser,
    body: {
      items: [{ id: "prod-1", quantity: 1 }],
      shippingSpeed: "standard",
      couponCode: "SAVE15",
      customer: {
        fullName: "Test Customer",
        phone: "01711111111",
        district: "Dhaka",
        address: "Banani, Road 11",
      },
    },
  });
  assert.equal(orderAfter.status, 201);
  assert.equal(orderAfter.data.data.couponCode, "SAVE15");
  assert.equal(orderAfter.data.data.discount, 150);
  assert.equal(orderAfter.data.data.subtotal, 1000);
});

test("discount tags: product creation with 12% off tag and bulk category discount", async () => {
  const adminUser = { id: "admin-1", role: "admin" };

  const db = mockDb({
    user: [{ id: "admin-1", role: "admin" }],
    categories: [{ name: "Beverages", slug: "beverages", subcategories: ["Coffee"] }],
    products: [
      {
        id: "bev-1",
        _id: "bev-1",
        name: "Cold Brew Coffee",
        slug: "cold-brew-coffee",
        brand: "BrewMaster",
        category: "beverages",
        subcategory: "Coffee",
        price: 500,
        stock: 20,
        images: ["/img/coffee.png"],
        isActive: true,
      },
    ],
  });

  const app = createApp({
    db,
    getSession: (req) => {
      const header = req.headers["x-test-session"];
      return header ? { user: JSON.parse(header) } : null;
    },
  });

  // 1. Create a product with discountPercentage: 12 and discountTag: "12% OFF"
  const newProductRes = await request(app, "POST", "/api/products", {
    session: adminUser,
    body: {
      name: "Special Arabica Coffee",
      brand: "BrewMaster",
      category: "beverages",
      subcategory: "Coffee",
      price: 1000,
      discountPercentage: 12,
      discountTag: "12% OFF",
      stock: 30,
      images: ["/img/arabica.png"],
      shortDescription: "Finest roasted coffee beans",
      fullDescription: "Authentic premium imported arabica beans from Colombia.",
    },
  });
  assert.equal(newProductRes.status, 201);
  // Auto calculated discountPrice for 1000 at 12% is 880
  assert.equal(newProductRes.data.data.discountPrice, 880);
  assert.equal(newProductRes.data.data.discountPercentage, 12);
  assert.equal(newProductRes.data.data.discountTag, "12% OFF");

  // 2. Admin applies a category-wide 12% off tag on "beverages"
  const bulkRes = await request(app, "POST", "/api/admin/discounts/apply", {
    session: adminUser,
    body: {
      targetType: "category",
      category: "beverages",
      discountPercentage: 12,
      discountTag: "12% OFF",
      campaignName: "12% off all Beverages",
    },
  });
  assert.equal(bulkRes.status, 200);
  assert.equal(bulkRes.data.success, true);
  assert.equal(bulkRes.data.modifiedCount, 2);

  // Check bev-1 (price 500) has been updated to 500 * (1 - 0.12) = 440 with tag "12% OFF"
  const updatedBev = await db.collection("products").findOne({ id: "bev-1" });
  assert.equal(updatedBev.discountPrice, 440);
  assert.equal(updatedBev.discountPercentage, 12);
  assert.equal(updatedBev.discountTag, "12% OFF");
});
