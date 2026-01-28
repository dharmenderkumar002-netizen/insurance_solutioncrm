import express from "express";
import {
  trackAll,
  trackGIC,
  trackLIC,
  trackHealth,
  trackNonMotor
} from "../controllers/track.controller.js";

const router = express.Router();

router.get("/all", trackAll);
router.get("/gic", trackGIC);
router.get("/lic", trackLIC);
router.get("/health", trackHealth);
router.get("/nonmotor", trackNonMotor);

export default router;