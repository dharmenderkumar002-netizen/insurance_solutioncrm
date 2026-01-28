import express from "express";
import { 
  saveLICBreakdown, 
  getLICBreakdown, 
  listLICDealers, 
  deleteLICEntry,
  getLatestLICDealer,
  listAllLICDealerRules
} from "../controllers/dealer-lic-commission.controller.js";

const router = express.Router();

router.post("/save-breakdown", saveLICBreakdown);
router.get("/get-breakdown", getLICBreakdown);
router.get("/dealer/list", listLICDealers);
router.get("/all-rules", listAllLICDealerRules); // ✅ Route for LIC Entry Page
router.post("/delete-entry", deleteLICEntry);

export default router;