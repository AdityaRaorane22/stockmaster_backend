const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
  quantity: { type: Number, default: 0 }
}, { timestamps: true });

// Compound index to ensure unique product per location
stockSchema.index({ product: 1, location: 1 }, { unique: true });

module.exports = mongoose.model("Stock", stockSchema);
