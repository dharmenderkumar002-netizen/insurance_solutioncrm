import express from "express";
import { 
  savePartnerLICBreakdown, 
  getPartnerLICBreakdown
} from "../controllers/partner-lic-commission.controller.js";

const router = express.Router();

router.post("/save-breakdown", savePartnerLICBreakdown);
router.get("/get-breakdown", getPartnerLICBreakdown);

export default router;
