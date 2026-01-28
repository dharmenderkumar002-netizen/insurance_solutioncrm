import express from "express";
import { 
  saveLIC, 
  getRecentLIC, // ✅ Added to fix 404 error
  getLICById,   // ✅ Added for Edit button
  updateLIC,    // ✅ Added for Update logic
  deleteLIC     // ✅ Added for Delete button
} from "../controllers/lic.controller.js";

const router = express.Router();

// 1. Create New Policy
router.post("/", saveLIC);

// 2. Get Recent Policies (Fixes the 404 Error)
router.get("/recent", getRecentLIC);

// 3. Get Single Policy by ID (For Edit Form)
router.get("/:id", getLICById);

// 4. Update Policy
router.put("/:id", updateLIC);

// 5. Delete Policy
router.delete("/:id", deleteLIC);

export default router;