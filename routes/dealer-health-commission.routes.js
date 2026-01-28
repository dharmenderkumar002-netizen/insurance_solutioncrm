import express from "express";
import HealthCommission from "../models/dealerhealthcommission.js";

const router = express.Router();

/* =====================================================
   1️⃣ SAVE: Health Commission (GIC STYLE)
===================================================== */
router.post("/save-breakdown", async (req, res) => {
  try {
    const { dealerName, date, items } = req.body;

    if (!dealerName || !date) {
      return res.status(400).json({
        success: false,
        message: "Dealer & Date required"
      });
    }

    const dealer = dealerName.trim();

    // 🔥 SAME DATE LOGIC AS GIC
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date"
      });
    }

    const start = new Date(dateObj); start.setHours(0, 0, 0, 0);
    const end   = new Date(dateObj); end.setHours(23, 59, 59, 999);

    // 🧹 DELETE SAME DAY (PER DEALER)
    await HealthCommission.deleteMany({
      dealerName: dealer,
      date: { $gte: start, $lte: end }
    });

    // ✅ INSERT NEW RECORD
    await HealthCommission.create({
      dealerName: dealer,
      date: dateObj,
      breakdownItems: items
    });

    res.json({ success: true });

  } catch (err) {
    console.error("SAVE ERROR:", err);
    res.status(500).json({ success: false });
  }
});

/* =====================================================
   2️⃣ GET: Health Breakdown (By Date / Latest)
===================================================== */
router.get("/get-breakdown", async (req, res) => {
  try {
    const { dealerName, date, fetchLatest } = req.query;
    if (!dealerName) {
      return res.json({ success: true, data: [] });
    }

    let query = { dealerName };

    // 🔥 Fetch latest
    if (fetchLatest === "true") {
      const latest = await HealthCommission
        .findOne(query)
        .sort({ date: -1 });

      return res.json({
        success: true,
        data: latest ? latest.breakdownItems : []
      });
    }

    // 🔥 Fetch by date
    if (date) {
      const d = new Date(date);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const record = await HealthCommission
      .findOne(query)
      .sort({ date: -1 });

    res.json({
      success: true,
      data: record ? record.breakdownItems : []
    });

  } catch (err) {
    console.error("GET ERROR:", err);
    res.status(500).json({ success: false });
  }
});

/* =====================================================
   3️⃣ LIST: Dealer List (Dashboard)
===================================================== */
router.get("/dealer/list", async (req, res) => {
  try {
    const records = await HealthCommission
      .find({})
      .sort({ date: -1 });

    res.json({
      success: true,
      data: records
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* =====================================================
   4️⃣ DELETE: Health Breakdown (DATE WISE)
===================================================== */
router.post("/delete-entry", async (req, res) => {
  try {
    const { dealerName, date } = req.body;
    if (!dealerName || !date) {
      return res.status(400).json({ success: false });
    }

    const d = new Date(date);
    const start = new Date(d); start.setHours(0, 0, 0, 0);
    const end   = new Date(d); end.setHours(23, 59, 59, 999);

    await HealthCommission.deleteMany({
      dealerName,
      date: { $gte: start, $lte: end }
    });

    res.json({ success: true });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ success: false });
  }
});

/* =====================================================
   5️⃣ ⭐ LATEST DEALER AUTO PICK (GIC STYLE)
===================================================== */
router.get("/latest-dealer", async (req, res) => {
  try {
    const { product, startDate } = req.query;
    if (!product || !startDate) {
      return res.json({ success: true, data: [] });
    }

    const d = new Date(startDate);
    const start = new Date(d); start.setHours(0, 0, 0, 0);

    const record = await HealthCommission.findOne({
      date: { $lte: start },
      "breakdownItems.product": { $regex: `^${product}$`, $options: "i" }
    })
    .sort({ date: -1 });

    if (!record) {
      return res.json({ success: true, data: [] });
    }

    const matched = record.breakdownItems.map(i => ({
      dealerName: record.dealerName,
      company: i.company
    }));

    res.json({ success: true, data: matched });

  } catch (err) {
    console.error("LATEST DEALER ERROR:", err);
    res.status(500).json({ success: false });
  }
});

export default router;
