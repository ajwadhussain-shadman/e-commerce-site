// server/models/Product.js
// Mongoose Model for Imported Products

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    brand: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, required: true },
    images: [{ type: String, required: true }],
    shortDescription: { type: String, required: true },
    fullDescription: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number, default: null },
    stock: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
    reviewCount: { type: Number, default: 0 },
    size: { type: String, default: "" },
    countryOfOrigin: { type: String, default: "Imported" },
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    specifications: { type: Map, of: String, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
