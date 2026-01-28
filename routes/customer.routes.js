// routes/customer.routes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { addCustomer, searchCustomers } from "../controllers/customer.controller.js";

const router = express.Router();

// --- 1. CONFIGURATION FOR FILE UPLOADS ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure 'uploads' directory exists
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename: fieldName-timestamp.extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- 2. ROUTES ---

// POST /api/customer/add
// We use upload.fields to handle specific file inputs sent from Frontend
router.post("/add", upload.fields([
    { name: 'panFile', maxCount: 1 },
    { name: 'adharFile', maxCount: 1 },
    { name: 'gstFile', maxCount: 1 }
]), addCustomer);

// GET /api/customer/search
router.get("/search", searchCustomers);

export default router;