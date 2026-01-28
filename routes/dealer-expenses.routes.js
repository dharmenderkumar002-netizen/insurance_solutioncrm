import express from "express";
import {
  // ===============================
  // GIC BREAKDOWN (SAVE / FETCH / DELETE)
  // ===============================
  saveBreakdown,
  getBreakdown,
  deleteEntry,

  // ===============================
  // GIC COMMISSION REPORT (MAIN LOGIC)
  // ===============================
  getDealerCommissionReport,

  // ===============================
  // DEALER EXPENSE / LIST
  // ===============================
  addDealerExpense,
  listDealerExpenses,

  // ===============================
  // SETTINGS & PARTNER (SAFE PLACEHOLDERS)
  // ===============================
  saveExpenseSettings,
  getExpenseSettings,
  addPartnerExpense,
  listPartnerExpenses,
  getPartnerExpenses
} from "../controllers/dealerExpenseController.js";

// ✅ NEW IMPORT (Controller for merging Dealer & Partner data)
import { getAllBreakdownForPartner } from "../controllers/partner-gic-commission.controller.js";

const router = express.Router();

/* =========================================================
   1. GIC COMMISSION BREAKDOWN ROUTES
========================================================= */

// Save / Update Dealer Commission Rules
router.post("/save-breakdown", saveBreakdown);

// Get Breakdown (latest or by date)
router.get("/get-breakdown", getBreakdown);

// ✅ NEW ROUTE (This fixes the 404 Error on Frontend)
// Gets Dealer Rules merged with Partner Saved Data
router.get('/dealer/gic/all-breakdown', getAllBreakdownForPartner);

// Delete Breakdown Entry (date wise)
router.post("/delete-entry", deleteEntry);

/* =========================================================
   2. GIC COMMISSION REPORT ROUTE (IMPORTANT)
========================================================= */

// 🔥 MAIN REPORT API (Frontend calls this)
router.post("/report/gic", getDealerCommissionReport);

/* =========================================================
   3. DEALER EXPENSE ROUTES
========================================================= */

// Save Dealer Expense (same as breakdown – kept for backward compatibility)
router.post("/dealer/add", addDealerExpense);

// List Dealer Expenses
router.get("/dealer/list", listDealerExpenses);

/* =========================================================
   4. SETTINGS & PARTNER ROUTES (SAFE)
========================================================= */

router.post("/save-settings", saveExpenseSettings);
router.get("/get-settings", getExpenseSettings);

router.post("/partner/add", addPartnerExpense);
router.get("/partner/list", listPartnerExpenses);
router.get("/partner/get", getPartnerExpenses);

export default router;