const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully."))
  .catch((err) => console.error("MongoDB connection error:", err));

// Ensure PYTHON_EXECUTABLE points to project venv python when available
if (!process.env.PYTHON_EXECUTABLE) {
  const fs = require('fs');
  const path = require('path');
  const candidates = [
    path.join(__dirname, '..', '.venv', 'Scripts', 'python.exe'),
    path.join(__dirname, '..', '.venv', 'bin', 'python'),
    path.join(__dirname, '..', '..', '.venv', 'Scripts', 'python.exe'),
    path.join(__dirname, '..', '..', '.venv', 'bin', 'python')
  ];
  for (const c of candidates) {
    try { if (fs.existsSync(c)) { process.env.PYTHON_EXECUTABLE = c; console.log('Set PYTHON_EXECUTABLE to', c); break; } } catch (e) {}
  }
}
console.log('PYTHON_EXECUTABLE=', process.env.PYTHON_EXECUTABLE || 'not-set');

// API routes
app.use("/api/products", productRoutes);
app.use("/api/user", userRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// Optional scheduled retrain (set RETRAIN_CRON env like '0 3 * * *' to run daily at 03:00)
if (process.env.RETRAIN_CRON) {
  try {
    const cron = require('node-cron');
    const retrainManager = require('./recommender/retrainManager');
    cron.schedule(process.env.RETRAIN_CRON, async () => {
      console.log('Scheduled retrain triggered');
      try { await retrainManager.startRetrain(); } catch (e) { console.error('Scheduled retrain failed', e); }
    });
    console.log('Retrain scheduler enabled:', process.env.RETRAIN_CRON);
  } catch (e) {
    console.error('Failed to enable retrain scheduler', e);
  }
}

// Model-run threshold (number of likes+reviews to auto-trigger an infer-only run)
const MODEL_RUN_THRESHOLD = Number(process.env.MODEL_RUN_THRESHOLD || 10);
console.log('MODEL_RUN_THRESHOLD =', MODEL_RUN_THRESHOLD);

// Serve frontend build (optional single-service deployment)
if (process.env.SERVE_FRONTEND === "true") {
  const distPath = path.join(__dirname, "..", "frontend", "dist");

  app.use(express.static(distPath));

  // Catch-all handler (FIXED for Node 22 / Express)
  app.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
