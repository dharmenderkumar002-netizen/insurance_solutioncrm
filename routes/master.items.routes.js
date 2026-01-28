import express from "express";
import MasterItem from "../models/masterItem.model.js";

const router = express.Router();

// Add item
router.post("/item/:type", async (req, res) => {
  try {
    const type = req.params.type;
    // compute s_no as count+1
    const count = await MasterItem.countDocuments({ type });
    const s_no = count + 1;
    const payload = {
      type,
      s_no,
      name: req.body.name || req.body.bank_name || "",
      meta: req.body.meta || req.body,   // prefer meta, fallback
      status: req.body.status || "Active",
      date: req.body.date || new Date().toISOString().split("T")[0],
    };
    const item = await MasterItem.create(payload);
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// List items
router.get("/item/:type", async (req, res) => {
  try {
    const type = req.params.type;
    const list = await MasterItem.find({ type }).sort({ s_no: 1 });
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update item
router.put("/item/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;
    const body = {
      name: req.body.name || req.body.bank_name || "",
      meta: req.body.meta || req.body,
      status: req.body.status,
      date: req.body.date,
    };
    const updated = await MasterItem.findByIdAndUpdate(id, body, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete item
router.delete("/item/:type/:id", async (req, res) => {
  try {
    await MasterItem.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
