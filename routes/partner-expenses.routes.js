import express from "express";
import { getPartnerCommissionReport } from "../controllers/partner-gic-commission.controller.js";

const router = express.Router();

// Route for the partner GIC commission report
router.post("/report/gic", getPartnerCommissionReport);

export default router;
