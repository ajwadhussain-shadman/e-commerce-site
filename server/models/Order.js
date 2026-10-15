// server/models/Order.js
// Mongoose Model for Customer Orders

const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    orderReference: { type: String, required: true, unique: true }, // e.g. NOV-84920
    customer: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true, index: true },
      email: { type: String, default: "" },
      district: { type: String, required: true },
      area: { type: String, default: "" },
      address: { type: String, required: true },
      notes: { type: String, default: "" },
    },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    couponCode: { type: String, default: null },
    paymentMethod: {
      type: String,
      enum: ["Cash on Delivery", "bKash Online", "Nagad Online", "Card"],
      default: "Cash on Delivery",
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
      index: true,
    },
    history: [
      {
        status: { type: String, required: true },
        time: { type: String, required: true },
        note: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
