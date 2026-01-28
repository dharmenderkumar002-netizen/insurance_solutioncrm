import express from "express";
import Bank from "../models/bank.model.js";
import MasterItem from "../models/masterItem.model.js";
import Master from "../models/master.model.js";
import { getPartners, addPartner, updatePartner, deletePartner } from "../controllers/master.controller.js";

const router = express.Router();

// Ensure this path matches the file name in Step 1

router.get("/partner", getPartners);
router.post("/partner/save", addPartner);
router.put("/partner/:id", updatePartner);
router.delete("/partner/:id", deletePartner);


/* =====================================================
    BANK CRUD
===================================================== */

// Add Bank
router.post("/bank", async (req, res) => {
    try {
        const data = await Bank.create(req.body);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// List Banks
router.get("/bank", async (req, res) => {
    try {
        const data = await Bank.find().sort({ _id: -1 });
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update Bank
router.put("/bank/:id", async (req, res) => {
    try {
        const data = await Bank.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Delete Bank
router.delete("/bank/:id", async (req, res) => {
    try {
        await Bank.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


/* =====================================================
    GENERIC MASTER ITEMS 
    (vehicle, fuel, gicproduct, coverage, etc.)
===================================================== */

// ADD ITEM
router.post("/item/:type", async (req, res) => {
    try {
        const type = req.params.type;
        const meta = req.body.meta || {};
        const name = req.body.name?.trim() || "";
        const nameLower = name.toLowerCase();

        /* ------------------------------------------------
           1️⃣ Duplicate Check: FUEL
        -------------------------------------------------- */
        if (type === "fuel") {
            const exists = await MasterItem.findOne({
                type: "fuel",
                "meta.fuel_lower": nameLower
            });

            if (exists) {
                return res.json({
                    success: false,
                    message: "Duplicate Fuel Type Not Allowed!"
                });
            }
        }

        /* ------------------------------------------------
           2️⃣ Duplicate Check: GIC PRODUCT
        -------------------------------------------------- */
        if (type === "gicproduct") {
            const exists = await MasterItem.findOne({
                type: "gicproduct",
                "meta.gic_lower": nameLower
            });

            if (exists) {
                return res.json({
                    success: false,
                    message: "Duplicate GIC Product Not Allowed!"
                });
            }
        }

        /* ------------------------------------------------
           3️⃣ Duplicate Check: VEHICLE (Make + Model)
        -------------------------------------------------- */
        if (type === "vehicle") {
            const make = meta.make?.trim().toLowerCase() || "";
            const model = meta.model?.trim().toLowerCase() || "";

            const exists = await MasterItem.findOne({
                type: "vehicle",
                "meta.make_lower": make,
                "meta.model_lower": model
            });

            if (exists) {
                return res.json({
                    success: false,
                    message: "Duplicate Vehicle! Same Make + Model Exists."
                });
            }
        }

        // Auto S.No
        const count = await MasterItem.countDocuments({ type });

        const item = await MasterItem.create({
            type,
            s_no: count + 1,
            name,
            status: req.body.status || "Active",
            date: req.body.date || new Date().toISOString().split("T")[0],
            meta: {
                ...meta,
                fuel_lower: nameLower,
                gic_lower: nameLower,
                make_lower: meta.make?.trim().toLowerCase() || "",
                model_lower: meta.model?.trim().toLowerCase() || ""
            }
        });

        res.json({ success: true, data: item });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});



/* =====================================================
    LIST ITEMS
===================================================== */

router.get("/item/:type", async (req, res) => {
    try {
        const type = req.params.type;
        const list = await MasterItem.find({ type }).sort({ s_no: 1 });
        res.json({ success: true, data: list });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});



/* =====================================================
    UPDATE ITEM
===================================================== */

router.put("/item/:type/:id", async (req, res) => {
    try {
        const type = req.params.type;
        const id = req.params.id;

        const meta = req.body.meta || {};
        const nameLower = req.body.name?.trim().toLowerCase() || "";

        /* Duplicate Fuel */
        if (type === "fuel") {
            const exists = await MasterItem.findOne({
                type: "fuel",
                "meta.fuel_lower": nameLower,
                _id: { $ne: id }
            });

            if (exists) {
                return res.json({
                    success: false,
                    message: "Duplicate Fuel Type Not Allowed!"
                });
            }
        }

        /* Duplicate GIC */
        if (type === "gicproduct") {
            const exists = await MasterItem.findOne({
                type: "gicproduct",
                "meta.gic_lower": nameLower,
                _id: { $ne: id }
            });

            if (exists) {
                return res.json({
                    success: false,
                    message: "Duplicate GIC Product Not Allowed!"
                });
            }
        }

        /* Duplicate Vehicle */
        if (type === "vehicle") {
            const make = meta.make?.trim().toLowerCase() || "";
            const model = meta.model?.trim().toLowerCase() || "";

            const exists = await MasterItem.findOne({
                type: "vehicle",
                "meta.make_lower": make,
                "meta.model_lower": model,
                _id: { $ne: id }
            });

            if (exists) {
                return res.json({
                    success: false,
                    message: "Duplicate Vehicle Not Allowed!"
                });
            }
        }

        const updated = await MasterItem.findByIdAndUpdate(
            id,
            {
                ...req.body,
                meta: {
                    ...meta,
                    fuel_lower: nameLower,
                    gic_lower: nameLower,
                    make_lower: meta.make?.trim().toLowerCase() || "",
                    model_lower: meta.model?.trim().toLowerCase() || ""
                }
            },
            { new: true }
        );

        res.json({ success: true, data: updated });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});



/* =====================================================
    DELETE ITEM
===================================================== */

router.delete("/item/:type/:id", async (req, res) => {
    try {
        await MasterItem.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});



/* =====================================================
    DEALER MODULE
===================================================== */

router.post("/dealer", async (req, res) => {
    try {
        const count = await Master.countDocuments({ type: "dealer" });

        const data = await Master.create({
            type: "dealer",
            s_no: count + 1,
            name: req.body.name,
            mobile: req.body.mobile,
            email: req.body.email,
            inout: req.body.inout,
            status: req.body.status,
            date: req.body.date
        });

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


router.get("/dealer", async (req, res) => {
    try {
        const list = await Master.find({ type: "dealer" }).sort({ s_no: 1 });
        res.json({ success: true, data: list });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* =====================================================
    DEALER UPDATE & DELETE  ✅ FINAL FIX
===================================================== */

// UPDATE DEALER
router.put("/dealer/:id", async (req, res) => {
    try {
        const updated = await Master.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                mobile: req.body.mobile,
                email: req.body.email,
                inout: req.body.inout,
                status: req.body.status,
                date: req.body.date
            },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Dealer not found"
            });
        }

        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE DEALER
router.delete("/dealer/:id", async (req, res) => {
    try {
        await Master.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


export default router;
