// server/server.js
// Express.js Backend Server for Importora (MongoDB + Mongoose Ready)

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/importora";

// Middleware
app.use(cors());
app.use(express.json());

// Models
const Product = require("./models/Product");
const Order = require("./models/Order");

// Database Connection Helper
async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
  }
}

// ---------------- API ROUTES ----------------

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Importora API", timestamp: new Date() });
});

// GET /api/products (Filtering & Sorting)
app.get("/api/products", async (req, res) => {
  try {
    await connectDB();
    const { category, brand, search, minPrice, maxPrice, sortBy } = req.query;
    let query = {};

    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sortBy === "price-low") sortOption = { price: 1 };
    if (sortBy === "price-high") sortOption = { price: -1 };
    if (sortBy === "rating") sortOption = { rating: -1 };

    const products = await Product.find(query).sort(sortOption);
    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/:slug
app.get("/api/products/:slug", async (req, res) => {
  try {
    await connectDB();
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/orders
app.post("/api/orders", async (req, res) => {
  try {
    await connectDB();
    const orderData = req.body;
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const orderReference = `NOV-${randomNum}`;

    const newOrder = new Order({
      orderReference,
      ...orderData,
      status: "Pending",
      history: [
        {
          status: "Order Placed",
          time: new Date().toLocaleString(),
          note: "Order placed via website checkout",
        },
      ],
    });

    await newOrder.save();
    res.status(201).json({ success: true, data: newOrder });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/orders/track/:orderRef
app.get("/api/orders/track/:orderRef", async (req, res) => {
  try {
    await connectDB();
    const order = await Order.findOne({ orderReference: req.params.orderRef.toUpperCase() });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Importora Express API listening on port ${PORT}`);
  });
}

module.exports = app;
