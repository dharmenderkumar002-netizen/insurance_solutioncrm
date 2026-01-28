import express from "express";
import {
  registerUser,
  listUsers,
  approveUser,
  changePassword,
  saveCompanyInfo,
  getCompanyInfo
} from "../controllers/settings.controller.js";

const router = express.Router();

router.post("/register", registerUser);
router.get("/users", listUsers);
router.post("/approve/:id", approveUser);   // approver (POST) to approve
router.post("/change-password", changePassword);

router.post("/company/save", saveCompanyInfo);
router.get("/company/get", getCompanyInfo);

export default router;
