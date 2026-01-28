
import healthcommission from "../models/dealerhealthcommission.js";

/* =====================================================
   🔒 DATE HELPERS (TIMEZONE SAFE – DO NOT REMOVE)
===================================================== */
const toDateKey = (d) => {
    if (!d) return null;
    return new Date(d).toISOString().split("T")[0]; // YYYY-MM-DD
};

const toSafeUTCDate = (dateInput) => {
    if (!dateInput) return null;
    const [y, m, d] = dateInput.split("-");
    return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0)); // 12 PM UTC (NO SHIFT)
};

/* =====================================================
   1️⃣ SAVE: Health Commission (History Safe)
===================================================== */
export const savehealthbreakdown = async (req, res) => {
    try {
        const { dealerName, date, items } = req.body;
        if (!dealerName || !date) {
            return res.json({ success: false, message: "Dealer & Date required" });
        }

        const dealer = dealerName.trim();
        const safeDate = toSafeUTCDate(date);
        if (!safeDate) return res.json({ success: false, message: "Invalid date" });

        const dayKey = toDateKey(safeDate);

        // 🔥 Sirf SAME DATE ka overwrite
        await healthcommission.deleteMany({
            dealerName: dealer,
            dateKey: dayKey
        });

        await healthcommission.create({
            dealerName: dealer,
            date: safeDate,
            dateKey: dayKey,
            breakdownItems: (items || []).map(i => ({
                ...i,
                percentOnNet: !!i.percentOnNet,
                OnNet: !!i.percentOnNet
            }))
        });

        res.json({ success: true });
    } catch (err) {
        console.error("SAVE HEALTH ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   2️⃣ GET: Health Breakdown
===================================================== */
export const getHealthBreakdown = async (req, res) => {
    try {
        const { dealerName, date, fetchLatest } = req.query;
        if (!dealerName) return res.json({ success: true, data: [] });

        const dealer = dealerName.trim();

        if (fetchLatest === "true") {
            const latest = await HealthCommission
                .findOne({ dealerName: dealer })
                .sort({ dateKey: -1 });
            return res.json({ success: true, data: latest ? latest.breakdownItems : [] });
        }

        let query = { dealerName: dealer };
        if (date) query.dateKey = date;

        const record = await HealthCommission
            .findOne(query)
            .sort({ dateKey: -1 });

        res.json({ success: true, data: record ? record.breakdownItems : [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   3️⃣ LIST: Dealer History (FIXED: Added Filter)
===================================================== */
export const listHealthDealers = async (req, res) => {
    try {
        const { dealerName } = req.query; // Frontend se dealerName lein

        let query = {};
        if (dealerName) {
            query.dealerName = dealerName.trim();
        }

        // Sirf wahi data layein jo manga gaya hai
        const list = await HealthCommission.find(query).sort({ dateKey: -1 });
        res.json({ success: true, data: list });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   4️⃣ DELETE: Specific Date
===================================================== */
export const deleteHealthEntry = async (req, res) => {
    try {
        const { dealerName, date } = req.body;
        if (!dealerName || !date) return res.json({ success: false });

        const result = await HealthCommission.deleteMany({
            dealerName: dealerName.trim(),
            dateKey: date
        });

        res.json({ success: result.deletedCount > 0 });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   5️⃣ ⭐ AUTO PICK (START DATE WISE – OPTIMIZED)
   File: dealerHealthCommission.js
===================================================== */
export const getLatestHealthDealerForEntry = async (req, res) => {
    try {
        const { product, startDate } = req.query; // startDate format: YYYY-MM-DD
        
        if (!product || !startDate) {
            return res.json({ success: true, data: null });
        }

        // 1. Database Query:
        // Find a document where product exists AND dateKey is <= startDate
        const record = await HealthCommission.findOne({
            "breakdownItems.product": product,
            dateKey: { $lte: startDate } // Less than or Equal to Start Date
        })
        .sort({ dateKey: -1 }) // Sort Descending (Latest date first)
        .lean(); // Faster performance

        if (!record) {
            return res.json({ success: true, data: null });
        }

        // 2. Extract Specific Product Details
        // Hamein Dealer Name mil gaya, ab andar se Company dhundhte hain
        const matchedItem = (record.breakdownItems || []).find(i => i.product === product);

        if (!matchedItem) {
            return res.json({ success: true, data: null });
        }

        // 3. Return Clean Data
        const finalData = {
            dealerName: record.dealerName,
            insCompany: matchedItem.company, // Insurance Co name
            effectiveDate: record.dateKey,   // Logic check karne ke liye
            product: matchedItem.product
        };

        res.json({ success: true, data: finalData });

    } catch (err) {
        console.error("LATEST DEALER ERROR:", err);
        res.status(500).json({ success: false, message: "Error fetching dealer config" });
    }
};