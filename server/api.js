const express = require("express");
const cors = require("cors");
const { ObjectId } = require("mongodb");
const multer = require("multer");
const { v2: defaultCloudinary } = require("cloudinary");
const { randomBytes, randomUUID } = require("node:crypto");
const { normalizeMoney, toMinorUnits, fromMinorUnits, formatBDT } = require("./currency.cjs");

const ORDER_STATUSES = new Set(["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"]);
const PAYMENT_METHOD = "Cash on Delivery";
const MAX_BODY_SIZE = "1mb";
const PRODUCT_FIELDS = ["name", "slug", "brand", "category", "subcategory", "images", "image", "imageAssets", "shortDescription", "fullDescription", "price", "discountPrice", "stock", "size", "countryOfOrigin", "isFeatured", "isNewArrival", "isBestSeller", "isActive", "specifications", "discountPercentage", "discountTag"];
const ORDER_TRANSITIONS = {
  Pending: new Set(["Confirmed", "Cancelled"]),
  Confirmed: new Set(["Processing", "Cancelled"]),
  Processing: new Set(["Shipped", "Cancelled"]),
  Shipped: new Set(["Delivered"]),
  Delivered: new Set(),
  Cancelled: new Set(),
};

function normalizedProductImages(document) {
  const images = Array.isArray(document?.images)
    ? document.images.map((image) => (typeof image === "string" ? image.trim() : "")).filter(Boolean)
    : [];
  if (!images.length && typeof document?.image === "string" && document.image.trim()) {
    images.push(document.image.trim());
  }
  return [...new Set(images)];
}

function publicProduct(document) {
  const images = normalizedProductImages(document);
  const result = {
    ...document,
    id: String(document.id || document._id),
    images,
    primaryImage: images[0] || "",
    image: images[0] || "",
  };
  const price = normalizeMoney(document.price);
  if (price !== null) result.price = price;
  if (document.discountPrice !== null && document.discountPrice !== undefined) {
    const discountPrice = normalizeMoney(document.discountPrice);
    if (discountPrice !== null) result.discountPrice = discountPrice;
  }
  if (document.discountPercentage !== null && document.discountPercentage !== undefined && document.discountPercentage !== "") {
    result.discountPercentage = Number(document.discountPercentage);
  } else if (result.discountPrice && result.price && result.price > result.discountPrice) {
    result.discountPercentage = Math.round(((result.price - result.discountPrice) / result.price) * 100);
  }
  if (document.discountTag) {
    result.discountTag = String(document.discountTag).trim();
  } else if (result.discountPercentage) {
    result.discountTag = `${result.discountPercentage}% OFF`;
  }
  return result;
}

function publicOrder(document) {
  const result = { ...document, id: document.orderReference };
  delete result.userId;
  delete result.idempotencyKey;
  return result;
}

function normalizePhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("00880")) digits = `0${digits.slice(5)}`;
  else if (digits.startsWith("880")) digits = `0${digits.slice(3)}`;
  return digits;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasImageSignature(buffer, mimeType) {
  if (!Buffer.isBuffer(buffer)) return false;
  if (mimeType === "image/jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === "image/webp") return buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  if (mimeType === "image/avif") return buffer.length >= 12 && buffer.toString("ascii", 4, 8) === "ftyp" && /^(avif|avis)$/.test(buffer.toString("ascii", 8, 12));
  return false;
}

const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 20, fields: 0, parts: 20 },
  fileFilter(_req, file, callback) {
    // Reject the whole request before any provider upload starts, so a mixed
    // valid/invalid selection cannot leave orphaned Cloudinary assets behind.
    if (!ACCEPTED_IMAGE_TYPES.has(file.mimetype)) {
      return callback(Object.assign(new Error("Only JPG, PNG, WebP or AVIF images are accepted"), { status: 400 }));
    }
    callback(null, true);
  },
});

function isSafeImageUrl(value) {
  if (typeof value !== "string" || !value.trim() || value.length > 2048) return false;
  const url = value.trim();
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch { return false; }
}

function validateCategory(input, current = {}) {
  const name = String(input?.name ?? current.name ?? "").trim();
  const slug = String(input?.slug ?? current.slug ?? name).trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const description = String(input?.description ?? current.description ?? "").trim();
  const image = String(input?.image ?? current.image ?? "").trim();
  const banner = String(input?.banner ?? current.banner ?? "").trim();
  const rawSubs = input?.subcategories ?? current.subcategories ?? [];
  if (!name || name.length > 120 || !slug || slug.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw Object.assign(new Error("A valid category name and slug are required"), { status: 400 });
  }
  if (description.length > 1000 || !Array.isArray(rawSubs) || rawSubs.length > 50) {
    throw Object.assign(new Error("Category description or subcategories are invalid"), { status: 400 });
  }
  if (image && !isSafeImageUrl(image) || banner && !isSafeImageUrl(banner)) {
    throw Object.assign(new Error("Category image URLs must use HTTP(S) or a local absolute path"), { status: 400 });
  }
  const subcategories = [...new Set(rawSubs.map((item) => String(item).trim()).filter(Boolean))];
  if (subcategories.some((item) => item.length > 100)) {
    throw Object.assign(new Error("Subcategory names must be 100 characters or fewer"), { status: 400 });
  }
  return { name, slug, description, image, banner, subcategories };
}

function validateBanner(input, current = {}) {
  const title = String(input?.title ?? current.title ?? "").trim().slice(0, 120);
  const image = String(input?.image ?? current.image ?? "").trim();
  const isActive = Boolean(input?.isActive ?? current.isActive ?? true);
  const order = Number.isSafeInteger(input?.order) ? input.order : Number.isSafeInteger(current?.order) ? current.order : 0;
  const rawImageAssets = Array.isArray(input?.imageAssets) ? input.imageAssets : Array.isArray(current?.imageAssets) ? current.imageAssets : [];
  const imageAssets = rawImageAssets.filter((asset) => asset?.url && asset?.publicId);

  if (!title) {
    throw Object.assign(new Error("Banner name is required"), { status: 400 });
  }
  if (!image || !isSafeImageUrl(image)) {
    throw Object.assign(new Error("A valid banner image is required"), { status: 400 });
  }
  if (order < 0 || order > 10000) {
    throw Object.assign(new Error("Banner order must be between 0 and 10000"), { status: 400 });
  }

  return { title, image, isActive, order, imageAssets };
}

function validateProduct(input, current = {}) {
  const value = {};
  for (const field of PRODUCT_FIELDS) {
    if (Object.hasOwn(input, field)) value[field] = input[field];
    else if (Object.hasOwn(current, field)) value[field] = current[field];
  }
  const requiredStrings = ["name", "brand", "category", "subcategory", "shortDescription", "fullDescription"];
  const missingFields = requiredStrings.filter((field) => typeof value[field] !== "string" || !value[field].trim());
  if (missingFields.length) {
    throw Object.assign(new Error(`Required product fields are missing: ${missingFields.join(", ")}`), { status: 400 });
  }
  const price = normalizeMoney(value.price);
  const stock = Number(value.stock ?? 0);
  if (price === null || price <= 0) throw Object.assign(new Error("price must be greater than zero"), { status: 400 });
  if (!Number.isSafeInteger(stock) || stock < 0) throw Object.assign(new Error("stock must be a non-negative whole number"), { status: 400 });
  const hasDiscountPrice = value.discountPrice !== null && value.discountPrice !== undefined && value.discountPrice !== "";
  let discountPrice = hasDiscountPrice ? normalizeMoney(value.discountPrice) : null;
  if (hasDiscountPrice && (discountPrice === null || discountPrice <= 0 || discountPrice > price)) {
    throw Object.assign(new Error("discountPrice must be positive and no greater than price"), { status: 400 });
  }

  let discountPercentage = null;
  if (value.discountPercentage !== null && value.discountPercentage !== undefined && value.discountPercentage !== "") {
    const rawPct = Number(value.discountPercentage);
    if (!Number.isNaN(rawPct) && rawPct >= 0 && rawPct <= 100) {
      discountPercentage = Math.round(rawPct * 100) / 100;
    }
  }

  if (discountPercentage !== null && discountPercentage > 0 && discountPrice === null && price > 0) {
    discountPrice = normalizeMoney(Math.round(price * (1 - discountPercentage / 100) * 100) / 100);
  } else if (discountPrice !== null && discountPercentage === null && price > 0) {
    discountPercentage = Math.round(((price - discountPrice) / price) * 100);
  }

  let discountTag = null;
  if (typeof value.discountTag === "string" && value.discountTag.trim()) {
    discountTag = value.discountTag.trim().slice(0, 60);
  } else if (discountPercentage !== null && discountPercentage > 0) {
    discountTag = `${discountPercentage}% OFF`;
  }

  const hasImagesArray = Array.isArray(value.images);
  const imageCandidates = hasImagesArray ? [...value.images] : [];
  if (!hasImagesArray && typeof value.image === "string" && value.image.trim()) {
    imageCandidates.push(value.image);
  }
  const images = [...new Set(imageCandidates.map((image) => (typeof image === "string" ? image.trim() : "")).filter(Boolean))];
  if (!images.length || images.length > 20 || images.some((image) => !isSafeImageUrl(image))) {
    throw Object.assign(new Error("at least one valid image is required"), { status: 400 });
  }
  if (price > 100000000) throw Object.assign(new Error("product price is outside the allowed range"), { status: 400 });
  const slug = String(value.slug || value.name).trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const rawImageAssets = Array.isArray(value.imageAssets) ? value.imageAssets : [];
  const isManagedAsset = (asset) => Boolean(asset) && typeof asset.publicId === "string" && /^importora\/products\/[a-f0-9-]{36}$/.test(asset.publicId) && typeof asset.url === "string" && isSafeImageUrl(asset.url) && asset.url.startsWith("https://res.cloudinary.com/");
  if (rawImageAssets.length > 20 || rawImageAssets.some((asset) => !isManagedAsset(asset) || !images.includes(asset.url))) {
    throw Object.assign(new Error("Persistent product images are invalid"), { status: 400 });
  }
  const assetByUrl = new Map(rawImageAssets.map((asset) => [asset.url, { publicId: asset.publicId, url: asset.url }]));
  const currentAssetsByUrl = new Map((Array.isArray(current.imageAssets) ? current.imageAssets : [])
    .filter(isManagedAsset)
    .map((asset) => [asset.url, { publicId: asset.publicId, url: asset.url }]));
  // Preserve an existing asset record when its URL is still in the gallery even
  // if an older client omitted imageAssets; never orphan a still-rendered asset.
  const imageAssets = images.map((url) => assetByUrl.get(url) || currentAssetsByUrl.get(url)).filter(Boolean);
  return {
    ...value,
    name: value.name.trim(), brand: value.brand.trim(), category: value.category.trim(),
    subcategory: value.subcategory.trim(), slug, price, discountPrice, discountPercentage, discountTag, stock, images, image: images[0],
    rating: 0,
    reviewCount: 0,
    imageAssets,
    size: String(value.size || ""), countryOfOrigin: String(value.countryOfOrigin || "Imported"),
    isFeatured: value.isFeatured === true, isNewArrival: value.isNewArrival === true,
    isBestSeller: value.isBestSeller === true, isActive: value.isActive !== false,
    specifications: value.specifications && typeof value.specifications === "object"
      ? Object.fromEntries(Object.entries(value.specifications).slice(0, 50).map(([key, spec]) => [String(key).slice(0, 80), String(spec).slice(0, 500)]))
      : {},
  };
}

function validateCustomer(customer) {
  const result = {
    fullName: String(customer?.fullName || "").trim(),
    phone: String(customer?.phone || "").trim(),
    email: String(customer?.email || "").trim(),
    district: String(customer?.district || "").trim(),
    area: String(customer?.area || "").trim(),
    address: String(customer?.address || "").trim(),
    notes: String(customer?.notes || "").trim().slice(0, 500),
  };
  if (!result.fullName || !result.phone || normalizePhone(result.phone).length < 7 || !result.district || !result.address) {
    throw Object.assign(new Error("Name, valid phone, district, and address are required"), { status: 400 });
  }
  if (result.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) {
    throw Object.assign(new Error("A valid email address is required"), { status: 400 });
  }
  return result;
}

function calculateOrder(items, shippingSpeed) {
  if (!Array.isArray(items) || !items.length || items.length > 50) {
    throw Object.assign(new Error("Order must contain between 1 and 50 items"), { status: 400 });
  }
  const quantities = new Map();
  for (const item of items) {
    const id = String(item?.id || "").trim();
    const quantity = Number(item?.quantity ?? item?.qty);
    if (!id || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) {
      throw Object.assign(new Error("Each order item needs a product id and quantity from 1 to 99"), { status: 400 });
    }
    quantities.set(id, (quantities.get(id) || 0) + quantity);
    if (quantities.get(id) > 99) throw Object.assign(new Error("Product quantity cannot exceed 99"), { status: 400 });
  }
  if (!["standard", "express"].includes(shippingSpeed || "standard")) {
    throw Object.assign(new Error("Invalid shipping speed"), { status: 400 });
  }
  return [...quantities].map(([id, quantity]) => ({ id, quantity }));
}

function makeOrderReference() {
  return `NOV-${randomBytes(8).toString("hex").toUpperCase()}`;
}

function createApiRouter({ db, getSession, client, cloudinaryClient = defaultCloudinary }) {
  if (!db || typeof db.collection !== "function") throw new Error("A connected MongoDB database is required");
  const router = express.Router();
const products = db.collection("products");
const orders = db.collection("orders");
const users = db.collection("user");
const reviews = db.collection("reviews");
const notifications = db.collection("notifications");
const banners = db.collection("banners");
const coupons = db.collection("coupons");
const discountRules = db.collection("discountRules");

coupons.createIndex({ code: 1 }, { unique: true }).catch(() => {});
coupons.createIndex({ isActive: 1, isApproved: 1 }).catch(() => {});
discountRules.createIndex({ targetType: 1, isActive: 1 }).catch(() => {});

  notifications.createIndex({ userId: 1, createdAt: -1 }).catch((error) => {
    console.warn("Failed to create notifications index:", error.message);
  });

  banners.createIndex({ order: 1 }).catch((error) => {
    console.warn("Failed to create banners order index:", error.message);
  });

  banners.createIndex({ isActive: 1, order: 1 }).catch((error) => {
    console.warn("Failed to create banners active order index:", error.message);
  });

  notifications.countDocuments().catch(() => {});
  banners.countDocuments().catch(() => {});

  function configureCloudinary() {
    const { CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: apiSecret } = process.env;
    if (!cloudName || !apiKey || !apiSecret) return false;
    cloudinaryClient.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
    return true;
  }

  async function removeUnusedCloudinaryAsset(publicId) {
    if (!configureCloudinary()) return false;
    const referencePattern = new RegExp(escapeRegex(publicId));
    const [productUse, orderUse] = await Promise.all([
      products.findOne({ $or: [{ "imageAssets.publicId": publicId }, { images: referencePattern }] }),
      orders.findOne({ "items.image": referencePattern }),
    ]);
    if (productUse || orderUse) return false;
    const result = await cloudinaryClient.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
    return result?.result === "ok" || result?.result === "not found";
  }

  async function cleanupUnusedAssets(assets) {
    for (const publicId of new Set((assets || []).map((asset) => asset?.publicId).filter((id) => typeof id === "string" && /^importora\/products\/[a-f0-9-]{36}$/.test(id)))) {
      try { await removeUnusedCloudinaryAsset(publicId); }
      catch { console.warn("Cloudinary image cleanup failed; an unused asset may need manual cleanup."); }
    }
  }

  function boundedPage(query) {
    const page = Math.max(1, Math.min(100000, Number.parseInt(query.page, 10) || 1));
    const limit = Math.max(1, Math.min(100, Number.parseInt(query.limit, 10) || 20));
    return { page, limit, skip: (page - 1) * limit };
  }

  async function productReviewStats(list) {
    if (!list.length) return list;
    const ids = list.map((product) => String(product.id || product._id));
    const approved = await reviews.find({ productId: { $in: ids }, status: "approved" }, { projection: { productId: 1, rating: 1 } }).toArray();
    const stats = new Map();
    for (const review of approved) {
      const value = stats.get(review.productId) || { total: 0, count: 0 };
      value.total += Number(review.rating) || 0;
      value.count += 1;
      stats.set(review.productId, value);
    }
    return list.map((product) => {
      const value = stats.get(String(product.id || product._id)) || { total: 0, count: 0 };
      return { ...product, rating: value.count ? value.total / value.count : 0, reviewCount: value.count };
    });
  }

  async function categoryProductRecords(category) {
    const selectors = [...new Set([category?.slug, category?.name].filter((value) => typeof value === "string" && value.trim()))];
    if (!selectors.length) return [];
    return products.find({ category: { $in: selectors } }).toArray();
  }

  async function validateProductCategory(product) {
    const category = await db.collection("categories").findOne({ slug: product.category });
    const categoryProducts = await categoryProductRecords(category || { slug: product.category });
    if (!category && categoryProducts.length === 0) {
      throw Object.assign(new Error("Select an existing category"), { status: 400 });
    }
    const configured = Array.isArray(category?.subcategories)
      ? category.subcategories.filter((value) => typeof value === "string" && value.trim())
      : [];
    const allowedSubcategories = configured.length
      ? configured
      : [...new Set(categoryProducts.map((item) => item.subcategory).filter((value) => typeof value === "string" && value.trim()))];
    if (!allowedSubcategories.includes(product.subcategory)) {
      throw Object.assign(new Error("Select a subcategory from the selected category"), { status: 400 });
    }
  }

  function userSelector(userId) {
    return { $or: [{ id: String(userId) }, { _id: String(userId) }, ...(ObjectId.isValid(String(userId)) ? [{ _id: new ObjectId(String(userId)) }] : [])] };
  }

  function normalizedRole(role) {
    return role === "admin" ? "admin" : "customer";
  }

  async function sessionFor(req) {
    return getSession ? getSession(req) : null;
  }

  async function requireUser(req, res, next) {
    try {
      const session = await sessionFor(req);
      if (!session?.user?.id) return res.status(401).json({ success: false, message: "Authentication required" });
      req.authSession = session;
      next();
    } catch {
      res.status(503).json({ success: false, message: "Authentication service unavailable" });
    }
  }

  async function requireAdmin(req, res, next) {
    try {
      const session = await sessionFor(req);
      if (!session?.user?.id) return res.status(401).json({ success: false, message: "Authentication required" });
      const currentUser = await users.findOne(userSelector(session.user.id), { projection: { id: 1, _id: 1, role: 1 } });
      if (normalizedRole(currentUser?.role) !== "admin") return res.status(403).json({ success: false, message: "Administrator access required" });
      req.authSession = { ...session, user: { ...session.user, role: "admin" } };
      next();
    } catch {
      res.status(503).json({ success: false, message: "Authentication service unavailable" });
    }
  }

  router.get("/health", (_req, res) => res.json({ status: "ok", service: "Importora API", timestamp: new Date() }));

  router.get("/products", async (req, res, next) => {
    try {
      const { category, subcategory, brand, search, minPrice, maxPrice, sortBy } = req.query;
      const query = { isActive: { $ne: false } };
      if (category) query.category = String(category).slice(0, 120);
      if (subcategory) query.subcategory = String(subcategory).slice(0, 120);
      if (brand) query.brand = String(brand).slice(0, 120);
      if (search) {
        const term = new RegExp(escapeRegex(String(search).slice(0, 100)), "i");
        query.$or = [{ name: term }, { brand: term }, { category: term }, { subcategory: term }, { shortDescription: term }];
      }
      for (const [field, raw] of [["minPrice", minPrice], ["maxPrice", maxPrice]]) {
        if (raw !== undefined && (!Number.isFinite(Number(raw)) || Number(raw) < 0)) {
          return res.status(400).json({ success: false, message: `Invalid ${field}` });
        }
      }
      if (req.query.isFeatured === "true") query.isFeatured = true;
      if (req.query.isNewArrival === "true") query.isNewArrival = true;
      if (req.query.isBestSeller === "true") query.isBestSeller = true;
      const sort = { "price-low": { price: 1 }, "price-high": { price: -1 }, rating: { rating: -1 }, newest: { createdAt: -1 } }[sortBy] || { createdAt: -1 };
      let result = await products.find(query).sort(sort).toArray();
      const min = minPrice === undefined ? null : Number(minPrice);
      const max = maxPrice === undefined ? null : Number(maxPrice);
      if (min !== null || max !== null) result = result.filter((product) => {
        const effectivePrice = Number(product.discountPrice || product.price);
        return (min === null || effectivePrice >= min) && (max === null || effectivePrice <= max);
      });
      result = await productReviewStats(result);
      return res.json({ success: true, count: result.length, data: result.map(publicProduct) });
    } catch (error) { next(error); }
  });

  router.get("/products/:slug/reviews", async (req, res, next) => {
    try {
      const pageInfo = boundedPage(req.query);
      const product = await products.findOne({ slug: req.params.slug, isActive: { $ne: false } }, { projection: { id: 1, _id: 1 } });
      if (!product) return res.status(404).json({ success: false, message: "Product not found" });
      const productId = String(product.id || product._id);
      const filter = { productId, status: "approved" };
      const [data, total] = await Promise.all([
        reviews.find(filter, { projection: { userId: 0, moderationHistory: 0, moderatedBy: 0 } }).sort({ createdAt: -1 }).skip(pageInfo.skip).limit(pageInfo.limit).toArray(),
        reviews.countDocuments(filter),
      ]);
      return res.json({ success: true, page: pageInfo.page, limit: pageInfo.limit, total, data });
    } catch (error) { next(error); }
  });

  router.get("/products/:slug", async (req, res, next) => {
    try {
      const product = await products.findOne({ slug: req.params.slug, isActive: { $ne: false } });
      if (!product) return res.status(404).json({ success: false, message: "Product not found" });
      const [withStats] = await productReviewStats([product]);
      return res.json({ success: true, data: publicProduct(withStats) });
    } catch (error) { next(error); }
  });

  router.get("/products/id/:id", async (req, res, next) => {
    try {
      const selector = ObjectId.isValid(req.params.id) ? { _id: new ObjectId(req.params.id) } : { id: req.params.id };
      const product = await products.findOne({ ...selector, isActive: { $ne: false } });
      if (!product) return res.status(404).json({ success: false, message: "Product not found" });
      return res.json({ success: true, data: publicProduct(product) });
    } catch (error) { next(error); }
  });

  router.get("/admin/products", requireAdmin, async (req, res, next) => {
    try {
      const pageInfo = boundedPage(req.query);
      const filter = {};
      const search = String(req.query.search || "").trim().slice(0, 100);
      if (search) filter.$or = ["name", "brand", "slug"].map((field) => ({ [field]: new RegExp(escapeRegex(search), "i") }));
      if (req.query.category) filter.category = String(req.query.category).slice(0, 120);
      if (req.query.status === "active") filter.isActive = { $ne: false };
      if (req.query.status === "inactive") filter.isActive = false;
      const sortKey = String(req.query.sort || "name");
      const sort = ({ name: { name: 1 }, newest: { createdAt: -1 }, stock: { stock: 1 }, price: { price: 1 } })[sortKey] || { name: 1 };
      const [records, total] = await Promise.all([
        products.find(filter).sort(sort).skip(pageInfo.skip).limit(pageInfo.limit).toArray(),
        products.countDocuments(filter),
      ]);
      const data = await productReviewStats(records);
      return res.json({ success: true, page: pageInfo.page, limit: pageInfo.limit, total, count: total, data: data.map(publicProduct) });
    } catch (error) { next(error); }
  });

  router.post("/admin/images/upload", requireAdmin, imageUpload.array("images", 20), async (req, res) => {
    if (!configureCloudinary()) return res.status(503).json({ success: false, message: "Image storage is not configured on the server" });
    const files = req.files || [];
    if (!files.length || files.length > 20 || files.some((file) => !hasImageSignature(file.buffer, file.mimetype))) {
      return res.status(400).json({ success: false, message: "Upload 1 to 20 valid JPG, PNG, WebP or AVIF images, each up to 10 MB" });
    }
    try {
      const results = await Promise.allSettled(files.map((file) => new Promise((resolve, reject) => {
        const stream = cloudinaryClient.uploader.upload_stream({
          folder: "importora/products",
          public_id: randomUUID(),
          overwrite: false,
          resource_type: "image",
          allowed_formats: ["jpg", "png", "webp", "avif"],
        }, (error, result) => {
          if (error) return reject(error);
          if (!result?.secure_url || !result?.public_id) return reject(new Error("Cloudinary returned an incomplete upload result"));
          resolve({ url: result.secure_url, publicId: result.public_id });
        });
        stream.end(file.buffer);
      })));
      const uploaded = results.filter((result) => result.status === "fulfilled").map((result) => result.value);
      const failure = results.find((result) => result.status === "rejected");
      if (failure) {
        await Promise.allSettled(uploaded.map((asset) => cloudinaryClient.uploader.destroy(asset.publicId, { resource_type: "image", invalidate: true })));
        return res.status(502).json({ success: false, message: "Image provider rejected the upload or is unavailable" });
      }
      return res.status(201).json({ success: true, data: uploaded, count: uploaded.length });
    } catch (error) {
      const providerAuthFailure = [401, 403].includes(Number(error?.http_code || error?.status));
      const message = providerAuthFailure
        ? "Cloudinary rejected the server configuration. Check the backend Cloudinary environment variables."
        : "Image provider rejected the upload or is unavailable";
      return res.status(502).json({ success: false, message });
    }
  });

  router.post("/admin/categories/upload-image", requireAdmin, imageUpload.single("image"), async (req, res) => {
    if (!configureCloudinary()) return res.status(503).json({ success: false, message: "Image storage is not configured on the server" });
    const file = req.file;
    if (!file || !hasImageSignature(file.buffer, file.mimetype)) {
      return res.status(400).json({ success: false, message: "Upload a valid JPG, PNG, WebP or AVIF image up to 10 MB" });
    }
    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinaryClient.uploader.upload_stream({
          folder: "importora/categories",
          public_id: randomUUID(),
          overwrite: false,
          resource_type: "image",
          allowed_formats: ["jpg", "png", "webp", "avif"],
        }, (error, result) => {
          if (error) return reject(error);
          if (!result?.secure_url || !result?.public_id) return reject(new Error("Cloudinary returned an incomplete upload result"));
          resolve({ url: result.secure_url, publicId: result.public_id });
        });
        stream.end(file.buffer);
      });
      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      const providerAuthFailure = [401, 403].includes(Number(error?.http_code || error?.status));
      const message = providerAuthFailure
        ? "Cloudinary rejected the server configuration. Check the backend Cloudinary environment variables."
        : "Image provider rejected the upload or is unavailable";
      return res.status(502).json({ success: false, message });
    }
  });

  router.post("/admin/images/destroy", requireAdmin, async (req, res, next) => {
    try {
      const publicId = String(req.body?.publicId || "");
      if (!/^importora\/products\/[a-f0-9-]{36}$/.test(publicId)) return res.status(400).json({ success: false, message: "Invalid managed image identifier" });
      if (!configureCloudinary()) return res.status(503).json({ success: false, message: "Image storage is not configured on the server" });
      const referencePattern = new RegExp(escapeRegex(publicId));
      const [productUse, orderUse] = await Promise.all([
        products.findOne({ $or: [{ "imageAssets.publicId": publicId }, { images: referencePattern }] }),
        orders.findOne({ "items.image": referencePattern }),
      ]);
      if (productUse || orderUse) return res.status(409).json({ success: false, message: "This image is still referenced by a product or order history" });
      const result = await cloudinaryClient.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
      if (!result || !["ok", "not found"].includes(result.result)) return res.status(502).json({ success: false, message: "Image provider could not remove the unused image" });
      return res.json({ success: true, removed: result.result === "ok" });
    } catch (error) { next(error); }
  });

  router.get("/admin/products/:id", requireAdmin, async (req, res, next) => {
    try {
      const selector = ObjectId.isValid(req.params.id) ? { _id: new ObjectId(req.params.id) } : { id: req.params.id };
      const product = await products.findOne(selector);
      if (!product) return res.status(404).json({ success: false, message: "Product not found" });
      const [withStats] = await productReviewStats([product]);
      return res.json({ success: true, data: publicProduct(withStats) });
    } catch (error) { next(error); }
  });

  router.post("/products", requireAdmin, async (req, res, next) => {
    try {
      const product = validateProduct(req.body || {});
      if (await products.findOne({ slug: product.slug })) return res.status(409).json({ success: false, message: "A product with that slug already exists" });
      await validateProductCategory(product);
      const now = new Date();
      const result = await products.insertOne({ ...product, createdAt: now, updatedAt: now });
      return res.status(201).json({ success: true, data: publicProduct({ ...product, _id: result.insertedId, createdAt: now, updatedAt: now }) });
    } catch (error) { next(error); }
  });

  router.put("/products/:id", requireAdmin, async (req, res, next) => {
    try {
      const selector = ObjectId.isValid(req.params.id) ? { _id: new ObjectId(req.params.id) } : { id: req.params.id };
      const existing = await products.findOne(selector);
      if (!existing) return res.status(404).json({ success: false, message: "Product not found" });
      const product = validateProduct(req.body || {}, existing);
      if (await products.findOne({ slug: product.slug, _id: { $ne: existing._id } })) return res.status(409).json({ success: false, message: "A product with that slug already exists" });
      await validateProductCategory(product);
      const { _id, createdAt, ...updates } = product;
      await products.updateOne(selector, { $set: { ...updates, updatedAt: new Date() } });
      const retainedAssetIds = new Set(product.imageAssets.map((asset) => asset.publicId));
      const retainedImageUrls = new Set(product.images);
      const removedAssets = (existing.imageAssets || []).filter((asset) => !retainedAssetIds.has(asset.publicId) && !retainedImageUrls.has(asset.url));
      await cleanupUnusedAssets(removedAssets);
      return res.json({ success: true, data: publicProduct({ ...existing, ...updates, updatedAt: new Date() }) });
    } catch (error) { next(error); }
  });

  router.delete("/products/:id", requireAdmin, async (req, res, next) => {
    try {
      const selector = ObjectId.isValid(req.params.id) ? { _id: new ObjectId(req.params.id) } : { id: req.params.id };
      const product = await products.findOne(selector);
      if (!product) return res.status(404).json({ success: false, message: "Product not found" });
      const id = String(product.id || product._id);
      const referenced = await orders.findOne({ "items.id": id });
      if (referenced) {
        await products.updateOne(selector, { $set: { isActive: false, archivedAt: new Date(), updatedAt: new Date() } });
        return res.json({ success: true, archived: true });
      }
      await products.deleteOne(selector);
      await cleanupUnusedAssets(product.imageAssets || []);
      return res.json({ success: true, archived: false });
    } catch (error) { next(error); }
  });

  router.get("/categories", async (_req, res, next) => {
    try {
      const categories = db.collection("categories");
      const saved = await categories.find({}).sort({ name: 1 }).toArray();
      const categoryBySlug = new Map(saved.filter((category) => typeof category.slug === "string").map((category) => [category.slug, category]));
      const productCategories = await products.distinct("category");
      for (const value of productCategories.filter((category) => typeof category === "string" && category.trim())) {
        const matchingSaved = saved.find((category) => category.slug === value || String(category.name || "").trim().toLowerCase() === value.trim().toLowerCase());
        const slug = matchingSaved?.slug || value;
        if (!categoryBySlug.has(slug)) {
          categoryBySlug.set(slug, matchingSaved || { id: slug, slug, name: value });
        }
      }
      const data = await Promise.all([...categoryBySlug.values()].map(async (category) => {
        const records = await categoryProductRecords(category);
        const productSubcategories = [...new Set(records.map((product) => product.subcategory).filter((value) => typeof value === "string" && value.trim()))].sort((a, b) => a.localeCompare(b));
        const configuredSubcategories = Array.isArray(category.subcategories)
          ? category.subcategories.filter((value) => typeof value === "string" && value.trim())
          : [];
        const subcategories = configuredSubcategories.length ? configuredSubcategories : productSubcategories;
        return {
          ...category,
          id: category.id || category.slug,
          subcategories,
          itemCount: records.filter((product) => product.isActive !== false).length,
        };
      }));
      data.sort((a, b) => String(a.name).localeCompare(String(b.name)));
      return res.json({ success: true, count: data.length, data });
    } catch (error) { next(error); }
  });

  router.post("/categories", requireAdmin, async (req, res, next) => {
    try {
      const category = validateCategory(req.body || {});
      const duplicate = await db.collection("categories").findOne({ slug: category.slug });
      if (duplicate || await products.findOne({ category: category.slug })) return res.status(409).json({ success: false, message: "A category with that slug already exists; edit the existing category instead" });
      const now = new Date();
      const result = await db.collection("categories").insertOne({ ...category, id: category.slug, createdAt: now, updatedAt: now });
      return res.status(201).json({ success: true, data: { ...category, id: category.slug, _id: result.insertedId, itemCount: 0 } });
    } catch (error) { next(error); }
  });

  router.put("/categories/:slug", requireAdmin, async (req, res, next) => {
    try {
      const categories = db.collection("categories");
      const existing = await categories.findOne({ slug: req.params.slug });
      const fallbackProducts = existing ? [] : await categoryProductRecords({ slug: req.params.slug });
      if (!existing && !fallbackProducts.length) return res.status(404).json({ success: false, message: "Category not found" });
      const fallback = existing || {
        id: req.params.slug,
        slug: req.params.slug,
        name: req.params.slug,
        subcategories: [...new Set(fallbackProducts.map((product) => product.subcategory).filter((value) => typeof value === "string" && value.trim()))],
      };
      const category = validateCategory(req.body || {}, fallback);
      if (category.slug !== req.params.slug && await products.findOne({ category: { $in: [req.params.slug, fallback.name] } })) {
        return res.status(409).json({ success: false, message: "A category slug cannot change while products use it" });
      }
      const duplicate = await categories.findOne({ slug: category.slug });
      if (duplicate && (!existing || String(duplicate._id) !== String(existing._id))) {
        return res.status(409).json({ success: false, message: "A category with that slug already exists" });
      }
      const now = new Date();
      if (existing) {
        await categories.updateOne({ _id: existing._id }, { $set: { ...category, id: category.slug, updatedAt: now } });
      } else {
        await categories.insertOne({ ...category, id: category.slug, createdAt: now, updatedAt: now });
      }
      const itemCount = await products.countDocuments({ category: { $in: [category.slug, category.name] }, isActive: { $ne: false } });
      return res.json({ success: true, data: { ...fallback, ...category, id: category.slug, itemCount, updatedAt: now } });
    } catch (error) { next(error); }
  });

  router.delete("/categories/:slug", requireAdmin, async (req, res, next) => {
    try {
      const categories = db.collection("categories");
      const category = await categories.findOne({ slug: req.params.slug });
      if (!category) {
        const productCategory = await products.findOne({ category: req.params.slug });
        if (productCategory) return res.status(409).json({ success: false, message: "This category still has products. Move or remove them before deleting it." });
        return res.status(404).json({ success: false, message: "Category not found" });
      }
      const inUse = await products.findOne({ $or: [{ category: category.slug }, { category: category.name }] });
      if (inUse) return res.status(409).json({ success: false, message: "This category still has products. Move or remove those products before deleting it." });
      await categories.deleteOne({ _id: category._id });
      return res.json({ success: true });
    } catch (error) { next(error); }
  });

  router.post("/reviews", requireUser, async (req, res, next) => {
    try {
      const productId = String(req.body?.productId || "").trim();
      const rating = Number(req.body?.rating);
      const title = String(req.body?.title || "").trim();
      const text = String(req.body?.text || "").trim();
      if (!productId || !Number.isInteger(rating) || rating < 1 || rating > 5 || title.length < 2 || title.length > 120 || text.length < 10 || text.length > 2000) {
        return res.status(400).json({ success: false, message: "Provide a 1–5 rating, a short title, and review text between 10 and 2000 characters" });
      }
      const productSelector = ObjectId.isValid(productId) ? { _id: new ObjectId(productId) } : { id: productId };
      const product = await products.findOne(productSelector);
      if (!product || product.isActive === false) return res.status(404).json({ success: false, message: "Product not found" });
      const reviewer = req.authSession.user;
      const id = String(reviewer.id);
      if (await reviews.findOne({ userId: id, productId: String(product.id || product._id) })) {
        return res.status(409).json({ success: false, message: "You have already reviewed this product" });
      }
      const now = new Date();
      const review = {
        id: randomUUID(), productId: String(product.id || product._id), productSlug: product.slug,
        productName: product.name, userId: id, userName: String(reviewer.name || "Customer").slice(0, 120),
        rating, title, text, status: "pending", createdAt: now, updatedAt: now, moderationHistory: [],
      };
      await reviews.insertOne(review);
      return res.status(201).json({ success: true, data: { id: review.id, status: review.status, createdAt: now } });
    } catch (error) { next(error); }
  });

  router.get("/reviews/mine", requireUser, async (req, res, next) => {
    try {
      const productId = String(req.query.productId || "").trim();
      if (!productId) return res.status(400).json({ success: false, message: "Product ID is required" });
      const review = await reviews.findOne({ userId: String(req.authSession.user.id), productId }, { projection: { moderationHistory: 0 } });
      return res.json({ success: true, data: review ? { id: review.id, productId: review.productId, rating: review.rating, title: review.title, text: review.text, status: review.status, createdAt: review.createdAt, updatedAt: review.updatedAt } : null });
    } catch (error) { next(error); }
  });

  router.put("/reviews/:reviewId", requireUser, async (req, res, next) => {
    try {
      const rating = Number(req.body?.rating);
      const title = String(req.body?.title || "").trim();
      const text = String(req.body?.text || "").trim();
      if (!Number.isInteger(rating) || rating < 1 || rating > 5 || title.length < 2 || title.length > 120 || text.length < 10 || text.length > 2000) {
        return res.status(400).json({ success: false, message: "Provide a 1–5 rating, a short title, and review text between 10 and 2000 characters" });
      }
      const selector = { id: req.params.reviewId, userId: String(req.authSession.user.id) };
      const existing = await reviews.findOne(selector);
      if (!existing) return res.status(404).json({ success: false, message: "Review not found" });
      const now = new Date();
      const updated = await reviews.updateOne({ ...selector, status: existing.status }, {
        $set: { rating, title, text, status: "pending", updatedAt: now },
        $push: { moderationHistory: { from: existing.status, to: "pending", actorUserId: String(req.authSession.user.id), at: now, action: "customer_edit" } },
      });
      if (!updated.matchedCount) return res.status(409).json({ success: false, message: "Review changed concurrently; refresh and try again" });
      return res.json({ success: true, data: { id: existing.id, status: "pending", rating, title, text, updatedAt: now } });
    } catch (error) { next(error); }
  });

  router.get("/admin/reviews", requireAdmin, async (req, res, next) => {
    try {
      const pageInfo = boundedPage(req.query);
      const filter = {};
      const status = String(req.query.status || "");
      if (["pending", "approved", "rejected", "removed"].includes(status)) filter.status = status;
      const [data, total] = await Promise.all([
        reviews.find(filter, { projection: { userId: 0, moderationHistory: 0 } }).sort({ createdAt: -1 }).skip(pageInfo.skip).limit(pageInfo.limit).toArray(),
        reviews.countDocuments(filter),
      ]);
      return res.json({ success: true, page: pageInfo.page, limit: pageInfo.limit, total, data });
    } catch (error) { next(error); }
  });

  router.patch("/admin/reviews/:reviewId", requireAdmin, async (req, res, next) => {
    try {
      const status = String(req.body?.status || "");
      const featured = req.body?.featured;
      if (!["approved", "rejected", "removed"].includes(status)) return res.status(400).json({ success: false, message: "Invalid moderation status" });
      const review = await reviews.findOne({ id: req.params.reviewId });
      if (!review) return res.status(404).json({ success: false, message: "Review not found" });
      const now = new Date();
      const update = {
        $set: { status, updatedAt: now, moderatedAt: now, moderatedBy: String(req.authSession.user.id) },
        $push: { moderationHistory: { from: review.status, to: status, actorUserId: String(req.authSession.user.id), at: now } },
      };
      if (typeof featured === "boolean") {
        update.$set.featured = featured;
      }
      await reviews.updateOne({ id: review.id, status: review.status }, update);
      return res.json({ success: true, data: { ...review, status, featured: featured ?? review.featured, updatedAt: now, moderatedAt: now } });
    } catch (error) { next(error); }
  });

  router.patch("/admin/reviews/:reviewId/featured", requireAdmin, async (req, res, next) => {
    try {
      const featured = Boolean(req.body?.featured);
      const review = await reviews.findOne({ id: req.params.reviewId });
      if (!review) return res.status(404).json({ success: false, message: "Review not found" });
      const now = new Date();
      await reviews.updateOne({ id: review.id }, { $set: { featured, updatedAt: now } });
      return res.json({ success: true, data: { ...review, featured, updatedAt: now } });
    } catch (error) { next(error); }
  });

  router.get("/reviews/featured", async (_req, res, next) => {
    try {
      const limit = Math.min(Number(_req.query.limit) || 10, 20);
      const data = await reviews.aggregate([
        { $match: { status: "approved", featured: true } },
        { $sort: { createdAt: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "id",
            as: "userData"
          }
        },
        { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            id: 1,
            productId: 1,
            productSlug: 1,
            productName: 1,
            userId: 1,
            userName: 1,
            rating: 1,
            title: 1,
            text: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            featured: 1,
            userImage: "$userData.image"
          }
        }
      ]).toArray();
      return res.json({ success: true, data });
    } catch (error) { next(error); }
  });

  router.get("/admin/metrics", requireAdmin, async (_req, res, next) => {
    try {
      const [activeProducts, categoriesCount, customerCount, totalOrders, pendingOrders, deliveredOrders, lowStock, recentOrders, deliveredRecords] = await Promise.all([
        products.countDocuments({ isActive: { $ne: false } }),
        db.collection("categories").countDocuments({}),
        users.countDocuments({ role: { $ne: "admin" } }),
        orders.countDocuments({}),
        orders.countDocuments({ status: { $in: ["Pending", "Confirmed", "Processing"] } }),
        orders.countDocuments({ status: "Delivered" }),
        products.find({ isActive: { $ne: false }, stock: { $lt: 15 } }).sort({ stock: 1 }).limit(10).toArray(),
        orders.find({}).sort({ createdAt: -1 }).limit(5).toArray(),
        orders.find({ status: "Delivered" }, { projection: { total: 1 } }).toArray(),
      ]);
      const deliveredCodOrderValue = deliveredRecords.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
      return res.json({ success: true, data: {
        activeProducts, categories: categoriesCount, customers: customerCount, totalOrders, pendingOrders, deliveredOrders,
        deliveredCodOrderValue, lowStock: lowStock.map(publicProduct), recentOrders: recentOrders.map(publicOrder),
      } });
    } catch (error) { next(error); }
  });

  // Admin notifications
  router.get("/admin/notifications", requireAdmin, async (req, res, next) => {
    try {
      const pageInfo = boundedPage(req.query);
      const filter = {};
      if (req.query.unread === "true") filter.read = { $ne: true };
      const [data, total] = await Promise.all([
        db.collection("notifications").find(filter).sort({ createdAt: -1 }).skip(pageInfo.skip).limit(pageInfo.limit).toArray(),
        db.collection("notifications").countDocuments(filter),
      ]);
      return res.json({ success: true, page: pageInfo.page, limit: pageInfo.limit, total, data });
    } catch (error) { next(error); }
  });

  router.get("/admin/notifications/unread-count", requireAdmin, async (_req, res, next) => {
    try {
      const count = await db.collection("notifications").countDocuments({ read: { $ne: true } });
      return res.json({ success: true, count });
    } catch (error) { next(error); }
  });

  router.patch("/admin/notifications/:id/read", requireAdmin, async (req, res, next) => {
    try {
      const { ObjectId } = require("mongodb");
      const result = await db.collection("notifications").updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { read: true, readAt: new Date() } }
      );
      if (!result.matchedCount) return res.status(404).json({ success: false, message: "Notification not found" });
      return res.json({ success: true });
    } catch (error) { next(error); }
  });

  router.patch("/admin/notifications/read-all", requireAdmin, async (_req, res, next) => {
    try {
      await db.collection("notifications").updateMany(
        { read: { $ne: true } },
        { $set: { read: true, readAt: new Date() } }
      );
      return res.json({ success: true });
    } catch (error) { next(error); }
  });

  router.post("/orders", async (req, res, next) => {
    let session;
    try { session = await sessionFor(req); }
    catch { return res.status(503).json({ success: false, message: "Authentication service unavailable" }); }
    let mongoSession;
    const reserved = [];
    try {
      const body = req.body || {};
      const customer = validateCustomer(body.customer);
      if (String(body.paymentMethod || PAYMENT_METHOD) !== PAYMENT_METHOD && String(body.paymentMethod || "").toLowerCase() !== "cod") {
        return res.status(400).json({ success: false, message: "Only cash on delivery is currently available" });
      }
      const idempotencyKey = String(body.idempotencyKey || "");
      if (idempotencyKey && !/^[A-Za-z0-9_-]{16,100}$/.test(idempotencyKey)) {
        return res.status(400).json({ success: false, message: "Invalid order request key" });
      }
      if (idempotencyKey) {
        const existing = await orders.findOne({ idempotencyKey, userId: session?.user?.id || null });
        if (existing) return res.status(200).json({ success: true, data: publicOrder(existing) });
      }
      const requestedItems = calculateOrder(body.items, body.shippingSpeed);
      const ids = requestedItems.map((item) => item.id);
      const objectIds = ids.filter(ObjectId.isValid).map((id) => new ObjectId(id));
      const productQuery = { $or: [{ id: { $in: ids } }, ...(objectIds.length ? [{ _id: { $in: objectIds } }] : [])] };
      const run = async (transactionSession) => {
        const found = await products.find(productQuery, transactionSession ? { session: transactionSession } : {}).toArray();
        const byId = new Map();
        for (const product of found) {
          byId.set(String(product.id || product._id), product);
          byId.set(String(product._id), product);
        }
        const orderItems = [];
        let subtotalMinor = 0;
        for (const requestItem of requestedItems) {
          const product = byId.get(requestItem.id);
          if (!product || product.isAvailable === false || product.isActive === false) throw Object.assign(new Error("One or more products are unavailable"), { status: 409 });
          if (!Number.isFinite(Number(product.stock)) || Number(product.stock) < requestItem.quantity) throw Object.assign(new Error("One or more products are out of stock"), { status: 409 });
          const price = normalizeMoney(product.discountPrice || product.price);
          const priceMinor = toMinorUnits(price);
          if (price === null || priceMinor === null || priceMinor <= 0) throw Object.assign(new Error("Product pricing is invalid"), { status: 409 });
          const result = await products.updateOne({ _id: product._id, stock: { $gte: requestItem.quantity } }, { $inc: { stock: -requestItem.quantity } }, transactionSession ? { session: transactionSession } : {});
          if (!result.modifiedCount) throw Object.assign(new Error("Product stock changed; please review your cart"), { status: 409 });
          reserved.push({ _id: product._id, quantity: requestItem.quantity });
          subtotalMinor += priceMinor * requestItem.quantity;
          orderItems.push({ id: String(product.id || product._id), name: product.name, price: fromMinorUnits(priceMinor), quantity: requestItem.quantity, image: normalizedProductImages(product)[0] || "" });
        }
        const subtotal = fromMinorUnits(subtotalMinor);
        const coupon = String(body.couponCode || "").trim().toUpperCase();
        let discountMinor = 0;
        let couponDoc = null;
        let couponFreeShipping = false;

        if (coupon) {
          couponDoc = await coupons.findOne({ code: coupon }, transactionSession ? { session: transactionSession } : {});
          if (couponDoc) {
            if (!couponDoc.isApproved) throw Object.assign(new Error("This promo code is not approved"), { status: 400 });
            if (couponDoc.isActive === false) throw Object.assign(new Error("This promo code is currently inactive"), { status: 400 });
            if (couponDoc.expiryDate && new Date(couponDoc.expiryDate) < new Date()) {
              throw Object.assign(new Error("This promo code has expired"), { status: 400 });
            }
            if (couponDoc.usageLimit && (couponDoc.usedCount || 0) >= couponDoc.usageLimit) {
              throw Object.assign(new Error("This promo code usage limit has been reached"), { status: 400 });
            }
            const minSpendMinor = toMinorUnits(couponDoc.minSpend || 0);
            if (minSpendMinor && subtotalMinor < minSpendMinor) {
              throw Object.assign(new Error(`Minimum order of ৳${couponDoc.minSpend} required for this promo code`), { status: 400 });
            }
            if (couponDoc.discountType === "percent") {
              let calc = Math.round((subtotalMinor * Number(couponDoc.discountValue || 0)) / 100);
              if (couponDoc.maxDiscount) {
                const maxCapMinor = toMinorUnits(couponDoc.maxDiscount);
                if (maxCapMinor !== null && calc > maxCapMinor) calc = maxCapMinor;
              }
              discountMinor = calc;
            } else if (couponDoc.discountType === "flat") {
              discountMinor = Math.min(toMinorUnits(couponDoc.discountValue || 0) || 0, subtotalMinor);
            } else if (couponDoc.discountType === "shipping") {
              couponFreeShipping = true;
            }
          } else if (coupon === "IMPORT10") {
            discountMinor = Math.round((subtotalMinor * 10) / 100);
          } else if (coupon === "WELCOME500") {
            if (subtotalMinor < 200000) throw Object.assign(new Error("WELCOME500 requires a minimum order of 2000"), { status: 400 });
            discountMinor = 50000;
          } else if (coupon !== "" && coupon !== "FREESHIP") {
            throw Object.assign(new Error("Invalid coupon code"), { status: 400 });
          }
        }
        const freeShipping = subtotalMinor >= 300000 || coupon === "FREESHIP" || couponFreeShipping;
        const dhaka = customer.district.toLowerCase() === "dhaka";
        const shippingFeeMinor = freeShipping ? 0 : dhaka ? 12000 : 18000;
        const expressFeeMinor = body.shippingSpeed === "express" ? 8000 : 0;
        const totalMinor = Math.max(0, subtotalMinor - discountMinor + shippingFeeMinor + expressFeeMinor);
        const now = new Date();
        const order = {
          orderReference: makeOrderReference(),
          userId: session?.user?.id || null,
          customer, items: orderItems, subtotal, discount: fromMinorUnits(discountMinor),
          shippingFee: fromMinorUnits(shippingFeeMinor + expressFeeMinor),
          total: fromMinorUnits(totalMinor),
          couponCode: coupon || null, paymentMethod: PAYMENT_METHOD, status: "Pending",
          inventoryReserved: true,
          ...(idempotencyKey ? { idempotencyKey } : {}),
          history: [{ status: "Order Placed", time: now.toISOString(), note: "Order placed via website checkout" }],
          createdAt: now, updatedAt: now,
        };
await orders.insertOne(order, transactionSession ? { session: transactionSession } : {});
        if (couponDoc?._id) {
          coupons.updateOne({ _id: couponDoc._id }, { $inc: { usedCount: 1 } }, transactionSession ? { session: transactionSession } : {}).catch(() => {});
        }
        // Create notifications for admins (non-blocking)
        try {
          const admins = await db.collection("user").find({ role: "admin" }).toArray();
          if (admins.length > 0) {
            const adminNotifications = admins.map((admin) => ({
              userId: String(admin.id || admin._id),
              type: "new_order",
              title: "New Order Received",
              message: `Order ${order.orderReference} for ${formatBDT(order.total)} has been placed.`,
              read: false,
              createdAt: now,
            }));
            for (const notification of adminNotifications) {
              await notifications.insertOne(notification);
            }
          }
        } catch (notificationError) {
          console.error("Failed to create admin notifications:", notificationError);
        }
        return order;
      };
      if (client?.startSession) {
        mongoSession = client.startSession();
        let order;
        await mongoSession.withTransaction(async () => { order = await run(mongoSession); });
        return res.status(201).json({ success: true, data: publicOrder(order) });
      }
      const order = await run(null);
      return res.status(201).json({ success: true, data: publicOrder(order) });
    } catch (error) {
      if (mongoSession) {
        // A transaction rollback restores every reservation.
      } else if (reserved.length) {
        await Promise.all(reserved.map((item) => products.updateOne({ _id: item._id }, { $inc: { stock: item.quantity } }).catch(() => {})));
      }
      next(error);
    } finally {
      await mongoSession?.endSession();
    }
  });

  router.get("/orders/mine", requireUser, async (req, res, next) => {
    try {
      const data = await orders.find({ userId: req.authSession.user.id }).sort({ createdAt: -1 }).toArray();
      return res.json({ success: true, count: data.length, data: data.map(publicOrder) });
    } catch (error) { next(error); }
  });

  router.get("/customers", requireAdmin, async (_req, res, next) => {
    try {
      const users = await db.collection("user")
        .find({}, { projection: { id: 1, name: 1, email: 1, phone: 1, district: 1, area: 1, createdAt: 1 } })
        .sort({ createdAt: -1 }).limit(500).toArray();
      const ids = users.map((user) => String(user.id || user._id));
      const customerOrders = ids.length
        ? await orders.find({ userId: { $in: ids } }, { projection: { userId: 1, total: 1, status: 1 } }).toArray()
        : [];
      const totals = new Map();
      for (const order of customerOrders) {
        const current = totals.get(order.userId) || { totalOrders: 0, totalSpend: 0 };
        current.totalOrders += 1;
        if (order.status === "Delivered") current.totalSpend += Number(order.total) || 0;
        totals.set(order.userId, current);
      }
      const data = users.map((user) => {
        const id = String(user.id || user._id);
        const summary = totals.get(id) || { totalOrders: 0, totalSpend: 0 };
        return {
          id, name: user.name || "Customer", email: user.email || "",
          phone: user.phone || "", district: user.district || "", area: user.area || "",
          createdAt: user.createdAt || null, ...summary,
        };
      });
      return res.json({ success: true, count: data.length, data });
    } catch (error) { next(error); }
  });

  router.get("/admin/users", requireAdmin, async (req, res, next) => {
    try {
      const page = Math.max(1, Math.min(10000, Number.parseInt(req.query.page, 10) || 1));
      const limit = Math.max(1, Math.min(100, Number.parseInt(req.query.limit, 10) || 25));
      const search = String(req.query.search || "").trim().slice(0, 100);
      const filter = search ? { $or: [
        { name: new RegExp(escapeRegex(search), "i") },
        { email: new RegExp(escapeRegex(search), "i") },
      ] } : {};
      const [records, total] = await Promise.all([
        users.find(filter, { projection: { id: 1, _id: 1, name: 1, email: 1, role: 1, createdAt: 1 } })
          .sort({ createdAt: -1, _id: 1 }).skip((page - 1) * limit).limit(limit).toArray(),
        users.countDocuments(filter),
      ]);
      return res.json({ success: true, page, limit, total, data: records.map((user) => ({
        id: String(user.id || user._id), name: user.name || "Customer", email: user.email || "",
        role: normalizedRole(user.role), createdAt: user.createdAt || null,
      })) });
    } catch (error) { next(error); }
  });

  router.patch("/admin/users/:userId/role", requireAdmin, async (req, res, next) => {
    if (!client?.startSession) return res.status(503).json({ success: false, message: "Role changes require MongoDB transaction support" });
    const targetId = String(req.params.userId || "").trim();
    const role = req.body?.role;
    if (!targetId || targetId.length > 200 || !["admin", "customer"].includes(role)) {
      return res.status(400).json({ success: false, message: "A valid user ID and role are required" });
    }
    const actorId = String(req.authSession.user.id);
    const mongoSession = client.startSession();
    let result;
    let failure;
    try {
      await mongoSession.withTransaction(async () => {
        failure = null;
        result = undefined;
        // Every role change writes this same document in the transaction. Concurrent
        // promotions/demotions therefore conflict and retry before counting admins.
        await db.collection("system").updateOne(
          { _id: "admin-role-mutation-lock" }, { $inc: { revision: 1 } },
          { upsert: true, session: mongoSession },
        );
        const actor = await users.findOne(userSelector(actorId), { session: mongoSession, projection: { id: 1, _id: 1, role: 1 } });
        if (normalizedRole(actor?.role) !== "admin") {
          failure = { status: 403, message: "Administrator access required" };
          return;
        }
        const target = await users.findOne(userSelector(targetId), { session: mongoSession, projection: { id: 1, _id: 1, role: 1 } });
        if (!target) {
          failure = { status: 404, message: "User not found" };
          return;
        }
        const previousRole = normalizedRole(target.role);
        if (previousRole === role) {
          result = { id: String(target.id || target._id), role };
          return;
        }
        if (actorId === targetId) {
          if (previousRole === "admin" && role === "customer" && await users.countDocuments({ role: "admin" }, { session: mongoSession }) <= 1) {
            failure = { status: 409, message: "The final administrator cannot be demoted" };
          } else {
            failure = { status: 403, message: "Users cannot change their own role" };
          }
          return;
        }
        if (previousRole === "admin" && role === "customer") {
          const adminCount = await users.countDocuments({ role: "admin" }, { session: mongoSession });
          if (adminCount <= 1) {
            failure = { status: 409, message: "The final administrator cannot be demoted" };
            return;
          }
        }
        const selector = userSelector(targetId);
        selector.role = target.role;
        const changedAt = new Date();
        const updated = await users.updateOne(selector, { $set: { role, updatedAt: changedAt } }, { session: mongoSession });
        if (!updated.matchedCount) {
          failure = { status: 409, message: "The user role changed concurrently; refresh and try again" };
          return;
        }
        await db.collection("roleAudit").insertOne({
          actorUserId: actorId, targetUserId: String(target.id || target._id), fromRole: previousRole,
          toRole: role, changedAt,
        }, { session: mongoSession });
        result = { id: String(target.id || target._id), role, changedAt };
      });
      if (failure) return res.status(failure.status).json({ success: false, message: failure.message });
      return res.json({ success: true, data: result });
    } catch (error) { next(error); }
    finally { await mongoSession.endSession(); }
  });

  router.get("/orders/receipt/:orderRef", requireUser, async (req, res, next) => {
    try {
      const order = await orders.findOne({ orderReference: req.params.orderRef.toUpperCase(), userId: req.authSession.user.id });
      if (!order) return res.status(404).json({ success: false, message: "Order not found" });
      return res.json({ success: true, data: publicOrder(order) });
    } catch (error) { next(error); }
  });

  router.get("/orders/track/:orderRef", async (req, res, next) => {
    try {
      const phone = normalizePhone(req.query.phone);
      if (phone.length < 7) return res.status(400).json({ success: false, message: "Enter the phone number used for this order" });
      const order = await orders.findOne({ orderReference: req.params.orderRef.toUpperCase() });
      if (!order || normalizePhone(order.customer?.phone) !== phone) return res.status(404).json({ success: false, message: "Order not found" });
      const safeOrder = {
        ...publicOrder(order),
        customer: { fullName: order.customer?.fullName, district: order.customer?.district, area: order.customer?.area },
      };
      delete safeOrder.userId;
      return res.json({ success: true, data: safeOrder });
    } catch (error) { next(error); }
  });

  router.get("/orders", requireAdmin, async (req, res, next) => {
    try {
      const filter = {};
      if (req.query.status && ORDER_STATUSES.has(String(req.query.status))) filter.status = String(req.query.status);
      const search = String(req.query.search || "").trim().slice(0, 100);
      if (search) {
        const term = new RegExp(escapeRegex(search), "i");
        filter.$or = [{ orderReference: term }, { "customer.fullName": term }, { "customer.phone": term }, { "customer.email": term }];
      }
      const from = req.query.from ? new Date(String(req.query.from)) : null;
      const to = req.query.to ? new Date(`${String(req.query.to).slice(0, 10)}T23:59:59.999Z`) : null;
      if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) return res.status(400).json({ success: false, message: "Invalid order date filter" });
      if (from || to) filter.createdAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
      const pageInfo = boundedPage(req.query);
      const [records, total] = await Promise.all([
        orders.find(filter).sort({ createdAt: -1 }).skip(pageInfo.skip).limit(pageInfo.limit).toArray(),
        orders.countDocuments(filter),
      ]);
      return res.json({ success: true, page: pageInfo.page, limit: pageInfo.limit, total, count: total, data: records.map(publicOrder) });
    } catch (error) { next(error); }
  });

  router.patch("/orders/:orderRef/status", requireAdmin, async (req, res, next) => {
    try {
      const status = String(req.body?.status || "");
      if (!ORDER_STATUSES.has(status)) return res.status(400).json({ success: false, message: "Invalid order status" });
      const now = new Date();
      const orderReference = req.params.orderRef.toUpperCase();
      const current = await orders.findOne({ orderReference });
      if (!current) return res.status(404).json({ success: false, message: "Order not found" });
      if (current.status === status) return res.json({ success: true, data: publicOrder(current) });
      if (!ORDER_TRANSITIONS[current.status]?.has(status)) {
        return res.status(409).json({ success: false, message: `Order cannot move from ${current.status} to ${status}` });
      }
      const updateOrder = async (transactionSession) => {
        const result = await orders.findOneAndUpdate(
          { orderReference, status: { $ne: "Cancelled" } },
          { $set: { status, updatedAt: now, ...(status === "Cancelled" && current.inventoryReserved ? { inventoryReserved: false } : {}) }, $push: { history: { status, time: now.toISOString(), note: "Status updated by administrator" } } },
          { returnDocument: "after", ...(transactionSession ? { session: transactionSession } : {}) }
        );
        if (!result) return orders.findOne({ orderReference });
        if (status === "Cancelled" && current.status !== "Cancelled" && current.inventoryReserved) {
          for (const item of current.items || []) {
            if (item.id && Number.isSafeInteger(Number(item.quantity)) && item.quantity > 0) {
              const filter = ObjectId.isValid(item.id) ? { _id: new ObjectId(item.id) } : { id: String(item.id) };
              await products.updateOne(filter, { $inc: { stock: Number(item.quantity) } }, transactionSession ? { session: transactionSession } : {});
            }
          }
        }
        return result;
      };
      let result;
      if (client?.startSession && status === "Cancelled" && current.status !== "Cancelled") {
        const mongoSession = client.startSession();
        try { await mongoSession.withTransaction(async () => { result = await updateOrder(mongoSession); }); }
        finally { await mongoSession.endSession(); }
      } else result = await updateOrder(null);
      return res.json({ success: true, data: publicOrder(result) });
    } catch (error) { next(error); }
  });

  // ============ BANNER ROUTES ============

  function publicBanner(document) {
    return {
      id: String(document.id || document._id),
      title: document.title,
      image: document.image,
      isActive: document.isActive === true,
      order: Number(document.order) || 0,
      imageAssets: Array.isArray(document.imageAssets) ? document.imageAssets : [],
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  router.post("/banners/reorder", requireAdmin, async (req, res, next) => {
    try {
      const { bannerIds } = req.body || {};
      if (!Array.isArray(bannerIds) || !bannerIds.length) {
        return res.status(400).json({ success: false, message: "Array of banner IDs is required" });
      }
      const now = new Date();
      const bulkOps = bannerIds.map((id, index) => {
        const selector = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };
        return { updateOne: { filter: selector, update: { $set: { order: index, updatedAt: now } } } };
      });
      await banners.bulkWrite(bulkOps);
      return res.json({ success: true });
    } catch (error) { next(error); }
  });

  router.post("/banners/upload", requireAdmin, imageUpload.array("images", 10), async (req, res) => {
    if (!configureCloudinary()) return res.status(503).json({ success: false, message: "Image storage is not configured on the server" });
    const files = req.files || [];
    if (!files.length || files.length > 10 || files.some((file) => !hasImageSignature(file.buffer, file.mimetype))) {
      return res.status(400).json({ success: false, message: "Upload 1 to 10 valid JPG, PNG, WebP or AVIF images, each up to 10 MB" });
    }
    try {
      const results = await Promise.allSettled(files.map((file) => new Promise((resolve, reject) => {
        const stream = cloudinaryClient.uploader.upload_stream({
          folder: "importora/banners",
          public_id: randomUUID(),
          overwrite: false,
          resource_type: "image",
          allowed_formats: ["jpg", "png", "webp", "avif"],
        }, (error, result) => {
          if (error) return reject(error);
          if (!result?.secure_url || !result?.public_id) return reject(new Error("Cloudinary returned an incomplete upload result"));
          resolve({ url: result.secure_url, publicId: result.public_id });
        });
        stream.end(file.buffer);
      })));
      const uploaded = results.filter((result) => result.status === "fulfilled").map((result) => result.value);
      const failure = results.find((result) => result.status === "rejected");
      if (failure) {
        await Promise.allSettled(uploaded.map((asset) => cloudinaryClient.uploader.destroy(asset.publicId, { resource_type: "image", invalidate: true })));
        return res.status(502).json({ success: false, message: "Image provider rejected the upload or is unavailable" });
      }
      return res.status(201).json({ success: true, data: uploaded, count: uploaded.length });
    } catch (error) {
      const providerAuthFailure = [401, 403].includes(Number(error?.http_code || error?.status));
      const message = providerAuthFailure
        ? "Cloudinary rejected the server configuration. Check the backend Cloudinary environment variables."
        : "Image provider rejected the upload or is unavailable";
      return res.status(502).json({ success: false, message });
    }
  });

  router.get("/banners", async (_req, res, next) => {
    try {
      const activeOnly = String(_req.query.active) === "true";
      const filter = activeOnly ? { isActive: true } : {};
      const list = await banners.find(filter).sort({ order: 1, createdAt: 1 }).toArray();
      return res.json({ success: true, count: list.length, data: list.map(publicBanner) });
    } catch (error) { next(error); }
  });

  router.get("/banners/:id", async (req, res, next) => {
    try {
      const selector = ObjectId.isValid(req.params.id) ? { _id: new ObjectId(req.params.id) } : { id: req.params.id };
      const banner = await banners.findOne(selector);
      if (!banner) return res.status(404).json({ success: false, message: "Banner not found" });
      return res.json({ success: true, data: publicBanner(banner) });
    } catch (error) { next(error); }
  });

  router.post("/banners", requireAdmin, async (req, res, next) => {
    try {
      const banner = validateBanner(req.body || {});
      const now = new Date();
      const result = await banners.insertOne({ ...banner, createdAt: now, updatedAt: now });
      return res.status(201).json({ success: true, data: publicBanner({ ...banner, _id: result.insertedId, createdAt: now, updatedAt: now }) });
    } catch (error) { next(error); }
  });

  router.put("/banners/:id", requireAdmin, async (req, res, next) => {
    try {
      const selector = ObjectId.isValid(req.params.id) ? { _id: new ObjectId(req.params.id) } : { id: req.params.id };
      const existing = await banners.findOne(selector);
      if (!existing) return res.status(404).json({ success: false, message: "Banner not found" });
      const banner = validateBanner(req.body || {}, existing);
      const now = new Date();
      await banners.updateOne(selector, { $set: { ...banner, updatedAt: now } });
      return res.json({ success: true, data: publicBanner({ ...existing, ...banner, updatedAt: now }) });
    } catch (error) { next(error); }
  });

  router.delete("/banners/:id", requireAdmin, async (req, res, next) => {
    try {
      const selector = ObjectId.isValid(req.params.id) ? { _id: new ObjectId(req.params.id) } : { id: req.params.id };
      const existing = await banners.findOne(selector);
      if (!existing) return res.status(404).json({ success: false, message: "Banner not found" });

      // Clean up Cloudinary assets
      if (configureCloudinary() && Array.isArray(existing.imageAssets) && existing.imageAssets.length) {
        for (const asset of existing.imageAssets) {
          if (asset?.publicId && /^importora\/banners\/[a-f0-9-]{36}$/.test(asset.publicId)) {
            try { await cloudinaryClient.uploader.destroy(asset.publicId, { resource_type: "image", invalidate: true }); }
            catch { console.warn("Cloudinary banner cleanup failed; an unused asset may need manual cleanup."); }
          }
        }
      }

      await banners.deleteOne(selector);
      return res.json({ success: true });
    } catch (error) { next(error); }
  });

  // --- Promo Code & Discount Tag Endpoints ---

  router.get("/coupons/active", async (_req, res, next) => {
    try {
      const now = new Date();
      const query = {
        isActive: true,
        isApproved: true,
        $or: [{ expiryDate: null }, { expiryDate: { $gt: now.toISOString() } }],
      };
      const list = await coupons.find(query).sort({ createdAt: -1 }).toArray();
      const sanitized = list
        .filter((c) => !c.usageLimit || (c.usedCount || 0) < c.usageLimit)
        .map((c) => ({
          id: String(c._id),
          code: c.code,
          description: c.description,
          discountType: c.discountType,
          discountValue: c.discountValue,
          minSpend: c.minSpend || 0,
          maxDiscount: c.maxDiscount || null,
          expiryDate: c.expiryDate || null,
        }));
      return res.json({ success: true, count: sanitized.length, data: sanitized });
    } catch (error) { next(error); }
  });

  router.post("/coupons/validate", async (req, res, next) => {
    try {
      const code = String(req.body?.code || "").trim().toUpperCase();
      const subtotal = Math.max(0, Number(req.body?.subtotal || 0));
      if (!code) return res.status(400).json({ success: false, message: "Coupon code is required" });

      const couponDoc = await coupons.findOne({ code });
      if (couponDoc) {
        if (!couponDoc.isApproved) {
          return res.status(400).json({ success: false, message: "This promo code is pending approval and cannot be used" });
        }
        if (couponDoc.isActive === false) {
          return res.status(400).json({ success: false, message: "This promo code is currently inactive" });
        }
        if (couponDoc.expiryDate && new Date(couponDoc.expiryDate) < new Date()) {
          return res.status(400).json({ success: false, message: "This promo code has expired" });
        }
        if (couponDoc.usageLimit && (couponDoc.usedCount || 0) >= couponDoc.usageLimit) {
          return res.status(400).json({ success: false, message: "This promo code usage limit has been reached" });
        }
        if (couponDoc.minSpend && subtotal < couponDoc.minSpend) {
          return res.status(400).json({ success: false, message: `Minimum order of ৳${couponDoc.minSpend} required for this promo code` });
        }

        let discount = 0;
        if (couponDoc.discountType === "percent") {
          discount = Math.round((subtotal * Number(couponDoc.discountValue || 0)) / 100);
          if (couponDoc.maxDiscount && discount > couponDoc.maxDiscount) discount = couponDoc.maxDiscount;
        } else if (couponDoc.discountType === "flat") {
          discount = Math.min(Number(couponDoc.discountValue || 0), subtotal);
        }

        return res.json({
          success: true,
          valid: true,
          coupon: {
            code: couponDoc.code,
            description: couponDoc.description,
            discountType: couponDoc.discountType,
            discountValue: couponDoc.discountValue,
            minSpend: couponDoc.minSpend || 0,
            maxDiscount: couponDoc.maxDiscount || null,
            freeShipping: couponDoc.discountType === "shipping",
          },
          discount,
          freeShipping: couponDoc.discountType === "shipping",
        });
      }

      // Legacy fallback support
      if (code === "IMPORT10") {
        const discount = Math.round((subtotal * 10) / 100);
        return res.json({
          success: true,
          valid: true,
          coupon: { code: "IMPORT10", description: "10% off entire order", discountType: "percent", discountValue: 10, minSpend: 0, freeShipping: false },
          discount,
          freeShipping: false,
        });
      }
      if (code === "WELCOME500") {
        if (subtotal < 2000) return res.status(400).json({ success: false, message: "WELCOME500 requires a minimum order of ৳2,000" });
        return res.json({
          success: true,
          valid: true,
          coupon: { code: "WELCOME500", description: "৳500 off on orders above ৳2,000", discountType: "flat", discountValue: 500, minSpend: 2000, freeShipping: false },
          discount: 500,
          freeShipping: false,
        });
      }
      if (code === "FREESHIP") {
        return res.json({
          success: true,
          valid: true,
          coupon: { code: "FREESHIP", description: "Free delivery nationwide", discountType: "shipping", discountValue: 0, minSpend: 0, freeShipping: true },
          discount: 0,
          freeShipping: true,
        });
      }

      return res.status(400).json({ success: false, message: "Invalid promo code" });
    } catch (error) { next(error); }
  });

  router.get("/admin/coupons", requireAdmin, async (req, res, next) => {
    try {
      const totalCount = await coupons.countDocuments();
      if (totalCount === 0) {
        const defaults = [
          {
            code: "IMPORT10",
            description: "10% off entire order",
            discountType: "percent",
            discountValue: 10,
            minSpend: 0,
            maxDiscount: null,
            isApproved: true,
            isActive: true,
            usedCount: 0,
            usageLimit: 500,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            code: "WELCOME500",
            description: "৳500 off on orders above ৳2,000",
            discountType: "flat",
            discountValue: 500,
            minSpend: 2000,
            maxDiscount: null,
            isApproved: true,
            isActive: true,
            usedCount: 0,
            usageLimit: 200,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            code: "FREESHIP",
            description: "Free delivery nationwide",
            discountType: "shipping",
            discountValue: 0,
            minSpend: 0,
            maxDiscount: null,
            isApproved: true,
            isActive: true,
            usedCount: 0,
            usageLimit: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            code: "SAVE12",
            description: "12% off storewide discount",
            discountType: "percent",
            discountValue: 12,
            minSpend: 1000,
            maxDiscount: 1500,
            isApproved: true,
            isActive: true,
            usedCount: 0,
            usageLimit: 100,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        await coupons.insertMany(defaults).catch(() => {});
      }

      const search = String(req.query.search || "").trim();
      const query = {};
      if (search) {
        query.$or = [
          { code: { $regex: escapeRegex(search), $options: "i" } },
          { description: { $regex: escapeRegex(search), $options: "i" } },
        ];
      }
      const data = await coupons.find(query).sort({ createdAt: -1 }).toArray();
      return res.json({
        success: true,
        count: data.length,
        data: data.map((c) => ({
          ...c,
          id: String(c._id),
        })),
      });
    } catch (error) { next(error); }
  });

  router.post("/admin/coupons", requireAdmin, async (req, res, next) => {
    try {
      const code = String(req.body?.code || "").trim().toUpperCase();
      if (!code || !/^[A-Z0-9_-]{3,30}$/.test(code)) {
        return res.status(400).json({ success: false, message: "Code must be 3-30 letters, numbers, hyphens, or underscores" });
      }
      const existing = await coupons.findOne({ code });
      if (existing) return res.status(409).json({ success: false, message: `Promo code "${code}" already exists` });

      const discountType = String(req.body?.discountType || "percent").toLowerCase();
      if (!["percent", "flat", "shipping"].includes(discountType)) {
        return res.status(400).json({ success: false, message: "Discount type must be 'percent', 'flat', or 'shipping'" });
      }

      let discountValue = Number(req.body?.discountValue || 0);
      if (discountType === "percent" && (Number.isNaN(discountValue) || discountValue <= 0 || discountValue > 100)) {
        return res.status(400).json({ success: false, message: "Percentage discount must be between 1 and 100" });
      }
      if (discountType === "flat" && (Number.isNaN(discountValue) || discountValue <= 0)) {
        return res.status(400).json({ success: false, message: "Flat discount amount must be greater than 0" });
      }
      if (discountType === "shipping") discountValue = 0;

      const minSpend = Math.max(0, Number(req.body?.minSpend || 0));
      const maxDiscount = req.body?.maxDiscount !== undefined && req.body?.maxDiscount !== null && req.body?.maxDiscount !== ""
        ? Math.max(0, Number(req.body.maxDiscount) || 0)
        : null;
      const usageLimit = req.body?.usageLimit !== undefined && req.body?.usageLimit !== null && req.body?.usageLimit !== ""
        ? Math.max(1, Number.parseInt(req.body.usageLimit, 10) || 0)
        : null;
      const expiryDate = req.body?.expiryDate ? new Date(req.body.expiryDate).toISOString() : null;
      const isApproved = req.body?.isApproved !== undefined ? Boolean(req.body.isApproved) : true;
      const isActive = req.body?.isActive !== undefined ? Boolean(req.body.isActive) : true;
      const description = String(req.body?.description || "").trim().slice(0, 300) || (discountType === "percent" ? `${discountValue}% off` : discountType === "flat" ? `৳${discountValue} flat off` : "Free Shipping");

      const now = new Date();
      const newCoupon = {
        code,
        description,
        discountType,
        discountValue,
        minSpend,
        maxDiscount,
        usageLimit,
        usedCount: 0,
        expiryDate,
        isApproved,
        isActive,
        createdAt: now,
        updatedAt: now,
      };

      const result = await coupons.insertOne(newCoupon);
      return res.status(201).json({
        success: true,
        data: { ...newCoupon, id: String(result.insertedId), _id: result.insertedId },
        message: `Promo code "${code}" created successfully`,
      });
    } catch (error) { next(error); }
  });

  function couponSelector(idOrCode) {
    const value = String(idOrCode || "").trim();
    if (ObjectId.isValid(value)) return { _id: new ObjectId(value) };
    return { $or: [{ id: value }, { _id: value }, { code: value.toUpperCase() }] };
  }

  router.put("/admin/coupons/:id", requireAdmin, async (req, res, next) => {
    try {
      const selector = couponSelector(req.params.id);
      const existing = await coupons.findOne(selector);
      if (!existing) return res.status(404).json({ success: false, message: "Promo code not found" });

      const updates = {};
      if (req.body?.code) {
        const code = String(req.body.code).trim().toUpperCase();
        if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return res.status(400).json({ success: false, message: "Code must be 3-30 letters, numbers, hyphens, or underscores" });
        if (code !== existing.code && (await coupons.findOne({ code, _id: { $ne: existing._id } }))) {
          return res.status(409).json({ success: false, message: `Promo code "${code}" already exists` });
        }
        updates.code = code;
      }
      if (req.body?.description !== undefined) updates.description = String(req.body.description).trim().slice(0, 300);
      if (req.body?.discountType) {
        const type = String(req.body.discountType).toLowerCase();
        if (!["percent", "flat", "shipping"].includes(type)) return res.status(400).json({ success: false, message: "Invalid discount type" });
        updates.discountType = type;
      }
      if (req.body?.discountValue !== undefined) {
        const val = Number(req.body.discountValue);
        if (Number.isNaN(val) || val < 0) return res.status(400).json({ success: false, message: "Invalid discount value" });
        updates.discountValue = val;
      }
      if (req.body?.minSpend !== undefined) updates.minSpend = Math.max(0, Number(req.body.minSpend) || 0);
      if (req.body?.maxDiscount !== undefined) updates.maxDiscount = req.body.maxDiscount ? Math.max(0, Number(req.body.maxDiscount) || 0) : null;
      if (req.body?.usageLimit !== undefined) updates.usageLimit = req.body.usageLimit ? Math.max(1, Number.parseInt(req.body.usageLimit, 10) || 0) : null;
      if (req.body?.expiryDate !== undefined) updates.expiryDate = req.body.expiryDate ? new Date(req.body.expiryDate).toISOString() : null;
      if (req.body?.isApproved !== undefined) updates.isApproved = Boolean(req.body.isApproved);
      if (req.body?.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);
      updates.updatedAt = new Date();

      await coupons.updateOne(selector, { $set: updates });
      const updated = await coupons.findOne(selector);
      return res.json({ success: true, data: { ...updated, id: String(updated._id) }, message: "Promo code updated successfully" });
    } catch (error) { next(error); }
  });

  router.patch("/admin/coupons/:id/approve", requireAdmin, async (req, res, next) => {
    try {
      const selector = couponSelector(req.params.id);
      const existing = await coupons.findOne(selector);
      if (!existing) return res.status(404).json({ success: false, message: "Promo code not found" });

      const newApproved = req.body?.isApproved !== undefined ? Boolean(req.body.isApproved) : !existing.isApproved;
      await coupons.updateOne(selector, { $set: { isApproved: newApproved, updatedAt: new Date() } });
      return res.json({ success: true, isApproved: newApproved, message: newApproved ? "Promo code approved" : "Promo code marked pending approval" });
    } catch (error) { next(error); }
  });

  router.patch("/admin/coupons/:id/status", requireAdmin, async (req, res, next) => {
    try {
      const selector = couponSelector(req.params.id);
      const existing = await coupons.findOne(selector);
      if (!existing) return res.status(404).json({ success: false, message: "Promo code not found" });

      const newStatus = req.body?.isActive !== undefined ? Boolean(req.body.isActive) : !existing.isActive;
      await coupons.updateOne(selector, { $set: { isActive: newStatus, updatedAt: new Date() } });
      return res.json({ success: true, isActive: newStatus, message: newStatus ? "Promo code activated" : "Promo code deactivated" });
    } catch (error) { next(error); }
  });

  router.delete("/admin/coupons/:id", requireAdmin, async (req, res, next) => {
    try {
      const selector = couponSelector(req.params.id);
      const result = await coupons.deleteOne(selector);
      if (!result.deletedCount) return res.status(404).json({ success: false, message: "Promo code not found" });
      return res.json({ success: true, message: "Promo code deleted" });
    } catch (error) { next(error); }
  });

  // --- Storewide & Category Discount Rules & Tag Endpoints ---

  router.get("/admin/discount-rules", requireAdmin, async (_req, res, next) => {
    try {
      const rules = await discountRules.find({}).sort({ createdAt: -1 }).toArray();
      return res.json({
        success: true,
        count: rules.length,
        data: rules.map((r) => ({ ...r, id: String(r._id) })),
      });
    } catch (error) { next(error); }
  });

  router.post("/admin/discounts/apply", requireAdmin, async (req, res, next) => {
    try {
      const {
        action = "apply",
        targetType = "all",
        category,
        productIds,
        discountPercentage,
        discountTag,
        campaignName,
      } = req.body || {};

      let filter = {};
      if (targetType === "category") {
        if (!category) return res.status(400).json({ success: false, message: "Category is required" });
        filter = { category: String(category).trim() };
      } else if (targetType === "product") {
        if (!Array.isArray(productIds) || !productIds.length) {
          return res.status(400).json({ success: false, message: "At least one product must be selected" });
        }
        const selectors = productIds.map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id));
        filter = { $or: [{ _id: { $in: selectors } }, { id: { $in: productIds } }] };
      }

      if (action === "remove") {
        const result = await products.updateMany(filter, {
          $set: { discountPrice: null, discountPercentage: null, discountTag: null, updatedAt: new Date() },
        });
        if (targetType === "category") {
          await discountRules.updateMany({ targetType: "category", category }, { $set: { isActive: false, updatedAt: new Date() } });
        } else if (targetType === "all") {
          await discountRules.updateMany({ targetType: "all" }, { $set: { isActive: false, updatedAt: new Date() } });
        }
        return res.json({ success: true, modifiedCount: result.modifiedCount, message: `Removed discounts from ${result.modifiedCount} product(s)` });
      }

      const pct = Number(discountPercentage);
      if (Number.isNaN(pct) || pct <= 0 || pct > 100) {
        return res.status(400).json({ success: false, message: "Discount percentage must be between 1 and 100" });
      }

      const tag = String(discountTag || `${Math.round(pct)}% OFF`).trim().slice(0, 60);

      const matchingProducts = await products.find(filter).toArray();
      let modifiedCount = 0;
      for (const prod of matchingProducts) {
        const price = Number(prod.price);
        if (price > 0) {
          const discountPrice = Math.max(1, Math.round(price * (1 - pct / 100) * 100) / 100);
          await products.updateOne(
            { _id: prod._id },
            {
              $set: {
                discountPrice,
                discountPercentage: Math.round(pct * 100) / 100,
                discountTag: tag,
                updatedAt: new Date(),
              },
            }
          );
          modifiedCount++;
        }
      }

      const now = new Date();
      await discountRules.insertOne({
        targetType,
        category: targetType === "category" ? category : null,
        productIds: targetType === "product" ? productIds : [],
        discountPercentage: Math.round(pct * 100) / 100,
        discountTag: tag,
        campaignName: campaignName || `${tag} on ${targetType === "all" ? "All Products" : targetType === "category" ? category : `${modifiedCount} Products`}`,
        affectedCount: modifiedCount,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      return res.json({
        success: true,
        modifiedCount,
        message: `Successfully applied "${tag}" to ${modifiedCount} product(s)!`,
      });
    } catch (error) { next(error); }
  });

  router.delete("/admin/discount-rules/:id", requireAdmin, async (req, res, next) => {
    try {
      const selector = ObjectId.isValid(req.params.id) ? { _id: new ObjectId(req.params.id) } : { id: req.params.id };
      const rule = await discountRules.findOne(selector);
      if (!rule) return res.status(404).json({ success: false, message: "Discount rule not found" });

      if (req.query?.revert === "true") {
        let filter = {};
        if (rule.targetType === "category") filter = { category: rule.category };
        else if (rule.targetType === "product" && Array.isArray(rule.productIds) && rule.productIds.length) {
          const selectors = rule.productIds.map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id));
          filter = { $or: [{ _id: { $in: selectors } }, { id: { $in: rule.productIds } }] };
        }
        await products.updateMany(filter, {
          $set: { discountPrice: null, discountPercentage: null, discountTag: null, updatedAt: new Date() },
        });
      }

      await discountRules.deleteOne(selector);
      return res.json({ success: true, message: "Discount rule removed" });
    } catch (error) { next(error); }
  });

  return router;
}

function createApp({ db, client, getSession, authHandler, frontendOrigins = [], cloudinaryClient = defaultCloudinary }) {
  const app = express();
  const origins = frontendOrigins.length ? frontendOrigins : ["http://localhost:3000"];
  app.disable("x-powered-by");
  app.use(cors({ origin(origin, callback) {
    if (!origin || origins.includes(origin)) return callback(null, true);
    return callback(null, false);
  }, credentials: true, methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] }));
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });
  app.use(express.json({ limit: MAX_BODY_SIZE, strict: true }));
  app.use("/api/auth", authHandler ? authHandler : (req, res, next) => next());
  app.use("/api", createApiRouter({ db, client, getSession, cloudinaryClient }));
  app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found" }));
  app.use((error, _req, res, _next) => {
    if (res.headersSent) return;
    if (error?.code === 11000) return res.status(409).json({ success: false, message: "A record with that unique value already exists" });
    if (error?.name === "MulterError") {
      const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      const message = error.code === "LIMIT_FILE_SIZE" ? "Each image must be 10 MB or smaller" : "Upload at most 20 images using the images field";
      return res.status(status).json({ success: false, message });
    }
    const status = Number.isInteger(error?.status) && error.status >= 400 && error.status < 500 ? error.status : 500;
    if (status >= 500) console.error(`API request failed (${error?.name || "Error"})`);
    return res.status(status).json({ success: false, message: status >= 500 ? "Internal server error" : error.message });
  });
  return app;
}

module.exports = { createApp, createApiRouter, calculateOrder, validateCustomer, validateProduct, normalizePhone, escapeRegex };
