import express from "express";
import { 
  savePartnerNonMotorBreakdown, 
  getPartnerNonMotorBreakdown
} from "../controllers/partner-nonmotor-commission.controller.js";

const router = express.Router();

router.post("/save-breakdown", savePartnerNonMotorBreakdown);
router.get("/get-breakdown", getPartnerNonMotorBreakdown);

export default router;
