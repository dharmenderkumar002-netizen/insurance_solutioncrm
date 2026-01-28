import express from "express";
import { 
  savePartnerHealthBreakdown, 
  getPartnerHealthBreakdown
} from "../controllers/partner-health-commission.controller.js";

const router = express.Router();

router.post("/save-breakdown", savePartnerHealthBreakdown);
router.get("/get-breakdown", getPartnerHealthBreakdown);

export default router;
