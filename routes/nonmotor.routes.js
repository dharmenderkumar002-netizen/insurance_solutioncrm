import express from "express";
import {
  saveNonMotor,
  getRecentNonMotor,
  getNonMotorById,
  updateNonMotor,
  deleteNonMotor,
  uploadNonMotorFile
} from "../controllers/nonmotor.controller.js";
import { uploadPolicy, uploadProposal, uploadAny } from "../middleware/upload.js";

const router = express.Router();

const uploadMiddleware = (req, res, next) => {
  const type = req.params.type;
  if (type === 'policy') {
    uploadPolicy.single('file')(req, res, next);
  } else if (type === 'proposal') {
    uploadProposal.single('file')(req, res, next);
  } else if (type === 'kyc') {
    uploadAny.single('file')(req, res, next);
  } else {
    res.status(400).json({ success: false, message: 'Invalid upload type' });
  }
};

router.post("/", saveNonMotor);
router.post("/upload/:id/:type", uploadMiddleware, uploadNonMotorFile);
router.get("/recent", getRecentNonMotor);
router.get("/:id", getNonMotorById);
router.put("/:id", updateNonMotor);
router.delete("/:id", deleteNonMotor);

export default router;