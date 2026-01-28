import express from "express";
import { 
    autocomplete,     // 1. IMPORT ADDED
    getGICById, 
    saveGIC, 
    getRecentGIC, 
    deleteGIC 
} from "../controllers/gic.controller.js";

const router = express.Router();

// ============================================
// 1. SEARCH ROUTE (Isse Sabse Upar Rakhein)
// ============================================
router.get("/autocomplete", autocomplete); 


// ============================================
// 2. OTHER SPECIFIC ROUTES
// ============================================
router.get("/recent-gic", getRecentGIC);
router.post("/save", saveGIC);
router.delete("/delete-gic/:id", deleteGIC);


// ============================================
// 3. GET BY ID ROUTES (Dynamic)
// ============================================

// Frontend ke 'fillForm' function ke liye ye URL zaroori hai:
router.get("/get-gic/:id", getGICById); 

// Fallback route (Isse hamesha last mein rakhein)
router.get("/:id", getGICById);

export default router;