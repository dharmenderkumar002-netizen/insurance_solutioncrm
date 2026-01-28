import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// Static files
app.use("/assets", express.static(path.resolve(__dirname, "../frontend/assets")));

// Dynamic imports to avoid load-time errors
async function loadRoutes() {
  try {
    const { default: authRoutes } = await import("../routes/auth.routes.js");
    const { default: customerRoutes } = await import("../routes/customer.routes.js");
    const { default: masterRoutes } = await import("../routes/master.routes.js");
    const { default: gicRoutes } = await import("../routes/gic.routes.js");
    const { default: healthRoutes } = await import("../routes/health.routes.js");
    const { default: licRoutes } = await import("../routes/lic.routes.js");
    const { default: nonmotorRoutes } = await import("../routes/nonmotor.routes.js");
    
    // API Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/customer", customerRoutes);
    app.use("/api/master", masterRoutes);
    app.use("/api/gic", gicRoutes);
    app.use("/api/health", healthRoutes);
    app.use("/api/lic", licRoutes);
    app.use("/api/nonmotor", nonmotorRoutes);

    console.log("✅ Routes loaded");
  } catch (error) {
    console.error("❌ Error loading routes:", error.message);
  }
}

// Load routes on startup
loadRoutes().catch(err => console.error("Route loading failed:", err));

// Health check
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Catch-all for static files
app.get("/:file", (req, res) => {
  const filePath = path.resolve(__dirname, `../frontend/${req.params.file}`);
  res.sendFile(filePath).catch(() => {
    res.status(404).json({ status: "ERROR", message: "Not Found" });
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ status: "ERROR", message: "Server error" });
});

export default app;
