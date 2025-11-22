const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors({
  origin: "https://stockmaster-frontend.vercel.app/",
  credentials: true
}));
app.use(express.json());

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const Stock = require("./models/Stock");
const StockMove = require("./models/StockMove");

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Warehouse Schema
const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortCode: { type: String, required: true, unique: true },
  address: { type: String, required: true }
}, { timestamps: true });

const Warehouse = mongoose.model("Warehouse", warehouseSchema);

// Location Schema
const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortCode: { type: String, required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true }
}, { timestamps: true });

const Location = mongoose.model("Location", locationSchema);

// ============ WAREHOUSE ROUTES ============

// GET all warehouses
app.get("/api/warehouses", async (req, res) => {
  try {
    const warehouses = await Warehouse.find();
    res.json(warehouses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single warehouse
app.get("/api/warehouses/:id", async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    res.json(warehouse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create warehouse
app.post("/api/warehouses", async (req, res) => {
  try {
    const warehouse = new Warehouse(req.body);
    await warehouse.save();
    res.status(201).json(warehouse);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update warehouse
app.put("/api/warehouses/:id", async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(warehouse);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE warehouse
app.delete("/api/warehouses/:id", async (req, res) => {
  try {
    await Warehouse.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ LOCATION ROUTES ============

// GET all locations
app.get("/api/locations", async (req, res) => {
  try {
    const filter = req.query.warehouse ? { warehouse: req.query.warehouse } : {};
    const locations = await Location.find(filter).populate("warehouse");
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single location
app.get("/api/locations/:id", async (req, res) => {
  try {
    const location = await Location.findById(req.params.id).populate("warehouse");
    res.json(location);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create location
app.post("/api/locations", async (req, res) => {
  try {
    const location = new Location(req.body);
    await location.save();
    const populated = await location.populate("warehouse");
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update location
app.put("/api/locations/:id", async (req, res) => {
  try {
    const location = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("warehouse");
    res.json(location);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE location
app.delete("/api/locations/:id", async (req, res) => {
  try {
    await Location.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ STOCK ROUTES ============

// GET all stock (aggregated)
app.get("/api/stocks", async (req, res) => {
  try {
    const stocks = await Stock.find().populate("product").populate("location");
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single stock by ID
app.get("/api/stocks/:id", async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id).populate("product").populate("location");
    res.json(stock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ PRODUCT SCHEMA ============
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  unitOfMeasure: { type: String, required: true },
  perUnitCost: { type: Number, required: true }
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

// ============ RECEIPT SCHEMA ============
const receiptSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },
  from: { type: String, default: "vendor" },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
  contact: { type: String, required: true },
  scheduledDate: { type: Date, required: true },
  status: { type: String, enum: ["Draft", "Waiting", "Ready", "Done", "Cancelled"], default: "Draft" },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    quantity: { type: Number, required: true }
  }],
  sourceDoc: { type: String },
  responsiblePerson: { type: String }
}, { timestamps: true });

const Receipt = mongoose.model("Receipt", receiptSchema);

// ============ DELIVERY SCHEMA ============
const deliverySchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },
  from: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
  to: { type: String, default: "customer" },
  contact: { type: String, required: true },
  scheduledDate: { type: Date, required: true },
  status: { type: String, enum: ["Draft", "Waiting", "Ready", "Done", "Cancelled"], default: "Draft" },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    quantity: { type: Number, required: true }
  }],
  deliveryAddress: { type: String },
  responsiblePerson: { type: String },
  operationType: { type: String }
}, { timestamps: true });

const Delivery = mongoose.model("Delivery", deliverySchema);

// ============ PRODUCT ROUTES ============
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ RECEIPT ROUTES ============
app.get("/api/receipts", async (req, res) => {
  try {
    const receipts = await Receipt.find()
      .populate("to")
      .populate("products.product");
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/receipts/:id", async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate("to")
      .populate("products.product");
    res.json(receipt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/receipts", async (req, res) => {
  try {
    // Auto generate reference
    const count = await Receipt.countDocuments();
    const reference = `WH/IN/${String(count + 1).padStart(5, "0")}`;
    const receipt = new Receipt({ ...req.body, reference });
    await receipt.save();
    const populated = await receipt.populate(["to", "products.product"]);
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/receipts/:id", async (req, res) => {
  try {
    const receipt = await Receipt.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("to")
      .populate("products.product");
    res.json(receipt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/receipts/:id", async (req, res) => {
  try {
    await Receipt.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ DELIVERY ROUTES ============
app.get("/api/deliveries", async (req, res) => {
  try {
    const deliveries = await Delivery.find()
      .populate("from")
      .populate("products.product");
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/deliveries/:id", async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate("from")
      .populate("products.product");
    res.json(delivery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/deliveries", async (req, res) => {
  try {
    const count = await Delivery.countDocuments();
    const reference = `WH/OUT/${String(count + 1).padStart(5, "0")}`;
    const delivery = new Delivery({ ...req.body, reference });
    await delivery.save();
    const populated = await delivery.populate(["from", "products.product"]);
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/deliveries/:id", async (req, res) => {
  try {
    const delivery = await Delivery.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("from")
      .populate("products.product");
    res.json(delivery);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/deliveries/:id", async (req, res) => {
  try {
    await Delivery.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ OPERATIONS ============

// Validate Receipt
app.post("/api/receipts/:id/validate", async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id).populate("products.product");
    if (receipt.status === "Done") return res.status(400).json({ error: "Already validated" });

    // Find default location for warehouse (first one found)
    const location = await Location.findOne({ warehouse: receipt.to });
    if (!location) return res.status(400).json({ error: "No location found for warehouse" });

    for (const item of receipt.products) {
      let stock = await Stock.findOne({ product: item.product._id, location: location._id });
      if (!stock) {
        stock = new Stock({ product: item.product._id, location: location._id, quantity: 0 });
      }
      stock.quantity += item.quantity;
      await stock.save();

      await StockMove.create({
        product: item.product._id,
        quantity: item.quantity,
        type: "Receipt",
        toLocation: location._id,
        reference: receipt.reference,
        date: receipt.scheduledDate || new Date()
      });
    }

    receipt.status = "Done";
    await receipt.save();
    res.json(receipt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validate Delivery
app.post("/api/deliveries/:id/validate", async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id).populate("products.product");
    if (delivery.status === "Done") return res.status(400).json({ error: "Already validated" });

    // Find default location for warehouse
    const location = await Location.findOne({ warehouse: delivery.from });
    if (!location) return res.status(400).json({ error: "No location found for warehouse" });

    for (const item of delivery.products) {
      let stock = await Stock.findOne({ product: item.product._id, location: location._id });
      if (!stock || stock.quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${item.product.name}` });
      }
      stock.quantity -= item.quantity;
      await stock.save();

      await StockMove.create({
        product: item.product._id,
        quantity: -item.quantity,
        type: "Delivery",
        fromLocation: location._id,
        reference: delivery.reference,
        date: delivery.scheduledDate || new Date()
      });
    }

    delivery.status = "Done";
    await delivery.save();
    res.json(delivery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Internal Transfer
app.post("/api/transfers", async (req, res) => {
  const { product, fromLocation, toLocation, quantity } = req.body;
  try {
    // Check source stock
    const sourceStock = await Stock.findOne({ product, location: fromLocation });
    if (!sourceStock || sourceStock.quantity < quantity) {
      return res.status(400).json({ error: "Insufficient stock at source location" });
    }

    // Deduct from source
    sourceStock.quantity -= quantity;
    await sourceStock.save();

    // Add to dest
    let destStock = await Stock.findOne({ product, location: toLocation });
    if (!destStock) {
      destStock = new Stock({ product, location: toLocation, quantity: 0 });
    }
    destStock.quantity += Number(quantity);
    await destStock.save();

    // Log Move
    await StockMove.create({
      product,
      quantity,
      type: "Internal",
      fromLocation,
      toLocation,
      reference: "INT/" + Date.now(),
      date: new Date()
    });

    res.json({ message: "Transfer successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stock Adjustment
app.post("/api/adjustments", async (req, res) => {
  const { product, location, quantity, type } = req.body; // type: "Set" or "Add"
  try {
    let stock = await Stock.findOne({ product, location });
    if (!stock) {
      stock = new Stock({ product, location, quantity: 0 });
    }

    const oldQty = stock.quantity;
    if (type === "Set") {
      stock.quantity = quantity;
    } else {
      stock.quantity += Number(quantity);
    }
    await stock.save();

    const diff = stock.quantity - oldQty;

    await StockMove.create({
      product,
      quantity: diff,
      type: "Adjustment",
      toLocation: location,
      reference: "ADJ/" + Date.now(),
      date: new Date()
    });

    res.json(stock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Stock Moves (History)
app.get("/api/moves", async (req, res) => {
  try {
    const moves = await StockMove.find()
      .populate("product")
      .populate("fromLocation")
      .populate("toLocation")
      .sort({ date: -1 });
    res.json(moves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard Stats
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const totalStockValue = await Stock.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ["$quantity", "$productDetails.perUnitCost"] } }
        }
      }
    ]);

    const lowStockCount = await Stock.countDocuments({ quantity: { $lt: 10 } });
    const pendingReceipts = await Receipt.countDocuments({ status: { $ne: "Done" } });
    const pendingDeliveries = await Delivery.countDocuments({ status: { $ne: "Done" } });

    // New KPIs
    const totalProducts = await Product.countDocuments();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lateReceipts = await Receipt.countDocuments({
      scheduledDate: { $lt: today },
      status: { $nin: ["Done", "Cancelled"] }
    });
    const lateDeliveries = await Delivery.countDocuments({
      scheduledDate: { $lt: today },
      status: { $nin: ["Done", "Cancelled"] }
    });
    const lateOps = lateReceipts + lateDeliveries;
    const waitingReceipts = await Receipt.countDocuments({ status: "Waiting" });
    const waitingDeliveries = await Delivery.countDocuments({ status: "Waiting" });
    const waitingOps = waitingReceipts + waitingDeliveries;

    // Recent Activity (Last 5 Stock Moves)
    const recentActivity = await StockMove.find()
      .sort({ date: -1 })
      .limit(5)
      .populate("product");

    // Chart Data - Year 2025 (Jan to Dec)
    const year2025Start = new Date('2025-01-01');
    const year2025End = new Date('2025-12-31T23:59:59.999Z'); // Ensure end of day for 2025-12-31

    const monthlyData = await StockMove.aggregate([
      {
        $match: {
          date: { $gte: year2025Start, $lte: year2025End }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: "$date" }
          },
          inbound: {
            $sum: {
              $cond: [{ $gt: ["$quantity", 0] }, "$quantity", 0]
            }
          },
          outbound: {
            $sum: {
              $cond: [{ $lt: ["$quantity", 0] }, { $abs: "$quantity" }, 0]
            }
          }
        }
      },
      {
        $sort: { "_id.month": 1 }
      }
    ]);

    // Create a map of month data
    const monthDataMap = {};
    monthlyData.forEach(item => {
      monthDataMap[item._id.month] = {
        inbound: item.inbound,
        outbound: item.outbound
      };
    });

    // Format chart data with all 12 months
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = monthNames.map((name, index) => {
      const monthNum = index + 1;
      const data = monthDataMap[monthNum] || { inbound: 0, outbound: 0 };
      return {
        name: name,
        in: data.inbound,
        out: data.outbound
      };
    });

    res.json({
      totalStockValue: totalStockValue[0]?.totalValue || 0,
      lowStockCount,
      pendingReceipts,
      pendingDeliveries,
      totalProducts,
      lateOps,
      waitingOps,
      recentActivity,
      chartData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
