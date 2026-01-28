import express from "express";
import { 
  savePartnerGICBreakdown, 
  getPartnerGICBreakdown 
} from "../controllers/partner-gic-commission.controller.js";

const router = express.Router();

// ==================================================================
// 1. SAVE ROUTE
// Frontend URL: /api/partner-gic-commission/save-breakdown
// ==================================================================
router.post("/save-breakdown", savePartnerGICBreakdown);


// ==================================================================
// 2. GET ROUTE (Merged Data: Dealer Rules + Partner Saved)
// Frontend URL: /api/partner-gic-commission/get-breakdown
// ==================================================================
router.get("/get-breakdown", getPartnerGICBreakdown);


// ==================================================================
// 3. BACKUP GET ROUTE (For compatibility)
// Agar frontend "/all-breakdown" call kare to bhi same data mile
// ==================================================================
router.get("/all-breakdown", getPartnerGICBreakdown);

export default router;