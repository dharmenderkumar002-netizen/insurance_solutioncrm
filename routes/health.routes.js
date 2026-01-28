// backend/routes/health.routes.js

import express from "express";
import {
    saveHealth,
    deleteHealth,
    getRecentHealth,
    getHealthById,
    getHealthByProductAndDate,
    autocomplete
} from "../controllers/health.controller.js";
import HealthEntry from "../models/healthentry.js";

const router = express.Router();

// ==========================================
// 0. AUTOCOMPLETE (Like GIC)
// ==========================================
router.get("/autocomplete", autocomplete);

// ==========================================
// 1. RECENT 10 RECORDS (For Dashboard)
// ==========================================
router.get("/recent", getRecentHealth);

// ==========================================
// 2. NEW TRACKING API (SEARCH & FILTER & EXPORT)
// ==========================================
router.get("/track", async (req, res) => {
    try {
        const { from, to, dateFilterField, search, partner, dealer } = req.query;
        let query = {};

        // A. Date Filter
        if (from && to && dateFilterField) {
            const startDate = new Date(from);
            const endDate = new Date(to);
            endDate.setHours(23, 59, 59, 999); // Poora din cover karein
            
            if (['createdAt', 'policyIssueDate', 'startDate'].includes(dateFilterField)) {
                query[dateFilterField] = { $gte: startDate, $lte: endDate };
            }
        }

        // B. Text Search
        if (search) {
            query.$or = [
                { policyNo: { $regex: search, $options: "i" } },
                { customerName: { $regex: search, $options: "i" } },
                { product: { $regex: search, $options: "i" } }
            ];
        }

        // C. Dropdown Filters
        if (partner) query.partner = partner;
        if (dealer) query.dealerName = dealer;

        const list = await HealthEntry.find(query)
            .populate("customer")
            .sort({ createdAt: -1 });

        res.json({ success: true, data: list });

    } catch (err) {
        console.error("Track Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// NEW: GET BY PRODUCT AND DATE
// ==========================================
router.get("/find-by-product-date", getHealthByProductAndDate);

// ==========================================
// 3. SAVE NEW POLICY (POST)
// ==========================================
router.post("/", saveHealth);

// ==========================================
// 4. GET SINGLE RECORD (For Edit)
// ==========================================
router.get("/:id", getHealthById);

// ==========================================
// 5. UPDATE POLICY (PUT)
// ==========================================
router.put("/:id", saveHealth);

// ==========================================
// 6. DELETE POLICY (DELETE)
// ==========================================
router.delete("/:id", deleteHealth);

export default router;