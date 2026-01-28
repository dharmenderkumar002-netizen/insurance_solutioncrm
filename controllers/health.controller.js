import HealthEntry from "../models/healthentry.js";
import Customer from "../models/customer.js";

/* =====================================================
   🔒 AUTOCOMPLETE
===================================================== */
export async function autocomplete(req, res) {
  try {
    const q = (req.query.q || "").trim();
    
    if (!q) return res.json({ healths: [], customers: [] });

    const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(safeQ, "i"); 
    
    // 1. Find Customers
    const customers = await Customer.find({ 
        $or: [ { name: re }, { mobile: re } ] 
    })
    .select('name mobile email address sno')
    .limit(10)
    .lean();

    // 2. Find Health Entries
    const customerIds = customers.map(c => c._id);

    const healths = await HealthEntry.find({
      $or: [
        { policyNo: re }, 
        { product: re }, 
        { endorsementNo: re }, 
        { customer: { $in: customerIds } }
      ]
    })
    .populate("customer", "name mobile address") 
    .select("policyNo product endorsementNo customer") 
    .limit(10)
    .lean();

    res.json({ healths, customers });

  } catch (err) { 
    console.error("❌ Autocomplete Error:", err); 
    res.status(500).json({ healths: [], customers: [] }); 
  }
}

/* =====================================================
   🔒 TIMEZONE SAFE DATE HELPERS (DO NOT REMOVE)
===================================================== */

/**
 * Convert YYYY-MM-DD → Date object at 12:00 UTC
 * (12 PM rule = no timezone backshift)
 */
const parseSafeDate = (dateInput) => {
  if (!dateInput) return null;

  // If already Date
  if (dateInput instanceof Date) return dateInput;

  // Expecting YYYY-MM-DD
  const [y, m, d] = dateInput.split("-");
  if (!y || !m || !d) return null;

  return new Date(Date.UTC(
    Number(y),
    Number(m) - 1,
    Number(d),
    12, 0, 0, 0
  ));
};

/**
 * Always return YYYY-MM-DD string (for comparisons / logs)
 */
const getDateKey = (dateInput) => {
  if (!dateInput) return null;
  return new Date(dateInput).toISOString().split("T")[0];
};

/* =====================================================
   SAVE / UPDATE HEALTH POLICY (TIMEZONE SAFE)
===================================================== */
export async function saveHealth(req, res) {
  try {
    const data = req.body;

    // Validation
    if (!data.policyNo || !data.customerName) {
      return res.status(400).json({
        success: false,
        message: "Bad input: Policy No and Name required"
      });
    }

    /* ================= CUSTOMER HANDLING ================= */
    let customerId = data.customerId;

    if (!customerId) {
      const cust = new Customer({
        sno: (await Customer.countDocuments()) + 1,
        name: data.customerName,
        email: data.customerEmail,
        mobile: data.customerMobile,
        address: data.address,
        partner: data.partner
      });
      await cust.save();
      customerId = cust._id;
    }

    /* ================= PAYLOAD ================= */
    const payload = {
      customer: customerId,

      // BASIC
      dealerName: data.dealerName,
      insCompany: data.insCompany,
      product: data.product,
      policyNo: data.policyNo,
      endorsementNo: data.endorsementNo,
      productType: data.productType,
      policyType: data.policyType,
      insuranceYear: data.insuranceYear,

      // 🔥 DATE SAFE (NO TIMEZONE SHIFT)
      policyIssueDate: parseSafeDate(data.policyIssueDate),
      issueDate: data.policyIssueDate
        ? parseSafeDate(data.policyIssueDate)
        : new Date(),
      startDate: parseSafeDate(data.startDate),
      endDate: parseSafeDate(data.endDate),

      // AMOUNTS
      premium: Number(data.premium || 0),
      netPremium: Number(data.netPremium || 0),
      net: Number(data.netPremium || 0), // legacy
      sumAssured: Number(data.sumAssured || 0),

      // EXTRA
      partner: data.partner,
      tpa: data.tpa,
      status: data.status,

      // FAMILY
      familyMembers: (data.familyMembers || []).map(m => ({
        name: m.name,
        relation: m.relation,
        dob: parseSafeDate(m.dob)
      })),

      // PREVIOUS POLICY
      previousPolicyNo: data.previousPolicyNo,
      pypInsCo: data.pypInsCo,
      pypEndDate: parseSafeDate(data.pypEndDate),

      previousPolicy: {
        insCo: data.pypInsCo,
        endDate: parseSafeDate(data.pypEndDate),
        previousPolicyNo: data.previousPolicyNo
      },

      // PAYMENT
      amountReceived: {
        amount: data.amountReceived?.amount,
        date: parseSafeDate(data.amountReceived?.date),
        paymentMode: data.amountReceived?.paymentMode,
        chequeDd: data.amountReceived?.chequeDd,
        bankName: data.amountReceived?.bankName
      },

      attachments: data.attachments || {}
    };

    /* ================= SAVE / UPDATE ================= */
    let result;
    const editId = req.params.id || data._id;

    if (editId) {
      result = await HealthEntry.findByIdAndUpdate(
        editId,
        payload,
        { new: true }
      );
    } else {
      const existing = await HealthEntry.findOne({
        policyNo: data.policyNo
      });

      if (existing) {
        result = await HealthEntry.findByIdAndUpdate(
          existing._id,
          payload,
          { new: true }
        );
      } else {
        result = await HealthEntry.create(payload);
      }
    }

    res.json({
      success: true,
      data: result,
      debug: {
        startDate: getDateKey(payload.startDate),
        endDate: getDateKey(payload.endDate)
      }
    });

  } catch (err) {
    console.error("Health Save Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server Error"
    });
  }
}

/* =====================================================
   DELETE HEALTH POLICY
===================================================== */
export async function deleteHealth(req, res) {
  try {
    const { id } = req.params;
    await HealthEntry.findByIdAndDelete(id);
    res.json({ success: true, message: "Health entry deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/* =====================================================
   RECENT HEALTH RECORDS
===================================================== */
export async function getRecentHealth(req, res) {
  try {
    const list = await HealthEntry
      .find()
      .populate("customer", "name mobile")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/* =====================================================
   GET SINGLE RECORD (EDIT MODE)
===================================================== */
export async function getHealthById(req, res) {
  try {
    const { id } = req.params;
    const entry = await HealthEntry
      .findById(id)
      .populate("customer");

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Not Found"
      });
    }

    res.json(entry);

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
}

export async function getHealthByProductAndDate(req, res) {
  try {
    const { product, startDate } = req.query;

    if (!product || !startDate) {
      return res.status(400).json({
        success: false,
        message: "Product and start date are required.",
      });
    }

    const searchDate = parseSafeDate(startDate);
    if (!searchDate) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date format. Please use YYYY-MM-DD.",
      });
    }
    
    const entry = await HealthEntry.findOne({
      product: product,
      startDate: { $lte: searchDate },
    }).sort({ startDate: -1 });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "No matching health entry found.",
      });
    }

    res.json({ success: true, data: entry });
  } catch (err) {
    console.error("Error fetching health entry by product and date:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
}
