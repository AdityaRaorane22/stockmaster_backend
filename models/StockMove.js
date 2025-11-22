const mongoose = require("mongoose");

const stockMoveSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true }, // Positive for IN, Negative for OUT
  type: { type: String, enum: ["Receipt", "Delivery", "Internal", "Adjustment"], required: true },
  fromLocation: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  toLocation: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  reference: { type: String }, // Doc reference (e.g. WH/IN/0001)
  date: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("StockMove", stockMoveSchema);
