import express from "express";
import {
  gicRenewals,
  licRenewals,
  healthRenewals,
  nonMotorRenewals
} from "../controllers/renewals.controller.js";

const router = express.Router();

router.get("/gic", gicRenewals);
router.get("/lic", licRenewals);
router.get("/health", healthRenewals);
router.get("/nonmotor", nonMotorRenewals);

export default router;
