import DealerNonMotorCommission from "../models/dealernonmotorcommission.js";

/* =========================================================
   HELPER: Standard Date Handler
   Converts input to Start of Day Date Object (Matches GIC)
========================================================= */
const getStartOfDay = (dateInput) => {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  const normalized = new Date(Date.UTC(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    0, 0, 0, 0
  ));
  return normalized;
};

/* =========================================================
   HELPER: Get Applicable Dealer Rule (Risk Date Wise)
========================================================= */
const getApplicableDealerRule = (records, product, riskStartDate) => {
  const rDate = getStartOfDay(riskStartDate);
  if (!rDate) return null;

  const validEntries = records
    .filter(r => r.date <= rDate)
    .sort((a, b) => b.date - a.date);

  if (!validEntries.length) return null;

  const latestEntry = validEntries[0];

  const rule = (latestEntry.rules || []).find(
    r => r.product?.toLowerCase() === product.toLowerCase()
  );

  if (!rule) return null;

  return {
    dealerName: latestEntry.dealerName,
    company: rule.company,
    product: rule.product,
    commissionDate: latestEntry.date
  };
};

/* =========================================================
   1️⃣ SAVE: NON-MOTOR BREAKDOWN
========================================================= */
export async function saveNonMotorBreakdown(req, res) {
  try {
    const { dealerName, date, items } = req.body;
    const dateKey = getStartOfDay(date);

    if (!dealerName || !dateKey) {
      return res.status(400).json({
        success: false,
        message: "Invalid Dealer Name or Date format"
      });
    }

    await DealerNonMotorCommission.deleteMany({
      dealerName: dealerName,
      date: dateKey
    });

    await DealerNonMotorCommission.create({
      dealerName,
      date: dateKey,
      rules: items,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: `Non-Motor commission saved successfully for ${dateKey
        .toISOString()
        .split("T")[0]}`
    });

  } catch (err) {
    console.error("SAVE NONMOTOR ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/* =========================================================
   2️⃣ GET: BREAKDOWN (Latest or Date Wise)
========================================================= */
export async function getNonMotorBreakdown(req, res) {
  try {
    const { dealerName, date, fetchLatest } = req.query;

    if (!dealerName) {
      return res.status(400).json({ success: false, message: "Dealer name required" });
    }

    if (fetchLatest === "true") {
      const latest = await DealerNonMotorCommission
        .findOne({ dealerName })
        .sort({ date: -1 });
      return res.json({ success: true, data: latest ? latest.rules : [] });
    }

    const dateKey = getStartOfDay(date);
    let query = { dealerName };
    if (dateKey) query.date = dateKey;

    const data = await DealerNonMotorCommission
      .findOne(query)
      .sort({ date: -1 });

    res.json({
      success: true,
      data: data ? data.rules : []
    });

  } catch (err) {
    console.error("GET NONMOTOR ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/* =========================================================
   3️⃣ DELETE: DATE-WISE ENTRY
========================================================= */
export async function deleteNonMotorEntry(req, res) {
  try {
    const { dealerName, date } = req.body;
    const dateKey = getStartOfDay(date);

    if (!dealerName || !dateKey) {
      return res.status(400).json({ success: false, message: "Dealer name & date required" });
    }

    const result = await DealerNonMotorCommission.deleteMany({
      dealerName,
      date: dateKey
    });

    res.json({
      success: true,
      message: "Non-Motor commission entry deleted",
      deletedCount: result.deletedCount
    });

  } catch (err) {
    console.error("DELETE NONMOTOR ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/* =========================================================
   4️⃣ LIST: ENTRIES FOR DASHBOARD (FIXED FILTER)
========================================================= */
export async function listNonMotorDealers(req, res) {
  try {
    // 1. Get dealerName from query (sent by frontend)
    const { dealerName } = req.query;

    // 2. Build Query Object
    let query = {};
    if (dealerName) {
      // Case-insensitive match or exact match depending on need.
      // Usually exact match is fine if frontend sends exact name.
      // Let's use exact match as per previous examples.
      query.dealerName = dealerName;
    }

    // 3. Find with Filter
    const list = await DealerNonMotorCommission
      .find(query) // <--- FIXED: Passed query object
      .select("dealerName rules date updatedAt")
      .sort({ date: -1 });

    const cleanList = list.map(item => ({
      dealerName: item.dealerName,
      date: item.date,
      items: item.rules
    }));

    res.json({
      success: true,
      data: cleanList
    });

  } catch (err) {
    console.error("LIST NONMOTOR ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
/* =========================================================
   5️⃣ REPORT LOGIC
========================================================= */
export async function getNonMotorCommissionReport(req, res) {
  try {
    const list = await DealerNonMotorCommission.find().sort({ date: -1 });
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/* =========================================================
   6️⃣ API: GET DEALER PAYOUT (RISK DATE WISE)
========================================================= */
export async function getNonMotorDealerPayout(req, res) {
  try {
    const { product, riskStartDate } = req.query;

    if (!product || !riskStartDate) {
      return res.json({ success: true, data: [] });
    }

    const records = await DealerNonMotorCommission
      .find()
      .select("dealerName rules date")
      .sort({ date: -1 });

    const dealerMap = new Map();

    records.forEach(rec => {
      if (!dealerMap.has(rec.dealerName)) {
        dealerMap.set(rec.dealerName, []);
      }
      dealerMap.get(rec.dealerName).push(rec);
    });

    const finalList = [];

    dealerMap.forEach(dealerRecords => {
      const applicable = getApplicableDealerRule(
        dealerRecords,
        product,
        riskStartDate
      );

      if (applicable) {
        finalList.push({
          dealerName: applicable.dealerName,
          company: applicable.company,
          product: applicable.product,
          effectiveDate: applicable.commissionDate
        });
      }
    });

    res.json({
      success: true,
      data: finalList
    });

  } catch (err) {
    console.error("NONMOTOR PAYOUT ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
