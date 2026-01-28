import express from "express";
import {
  saveNonMotorBreakdown,
  getNonMotorBreakdown,
  deleteNonMotorEntry,
  listNonMotorDealers,
  getNonMotorCommissionReport,
  getNonMotorDealerPayout,   
} from "../controllers/dealer-nonmotor-commission.controller.js";

const router = express.Router();


/* BASE PATH (from server.js): /api/expenses/nonmotor
   
   Final URLs will be:
   - POST /api/expenses/nonmotor/save-breakdown
   - GET  /api/expenses/nonmotor/get-breakdown
   - POST /api/expenses/nonmotor/delete-entry
   - GET  /api/expenses/nonmotor/dealer/list
*/

router.post("/save-breakdown", saveNonMotorBreakdown);
router.get("/get-breakdown", getNonMotorBreakdown);
router.post("/delete-entry", deleteNonMotorEntry);
router.get("/dealer/list", listNonMotorDealers);
router.post("/report/nonmotor", getNonMotorCommissionReport);
router.get("/expenses/nonmotor/dealer/list",getNonMotorDealerPayout);
export default router;