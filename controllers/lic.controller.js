import LICEntry from "../models/licentry.js";
import Customer from "../models/customer.js";

// Helper to handle date conversion safely
const toSafeDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

// ==========================================
// CREATE NEW LIC POLICY
// ==========================================
export async function saveLIC(req, res) {
  try {
    const data = req.body;

    // --- Validation ---
    if (!data.policyNo || !data.customerName) {
      return res.status(400).json({ success: false, message: "Policy number and customer name are required." });
    }

    // --- Customer Handling ---
    let customerId = data.customerId;
    if (!customerId && data.customerName) {
      // Try to find customer by mobile to avoid duplicates
      const existingCust = data.mobile ? await Customer.findOne({ mobile: data.mobile }) : null;
      if (existingCust) {
        customerId = existingCust._id;
      } else {
        // Create new customer if not found
        const count = await Customer.countDocuments();
        const newCustomer = new Customer({
          sno: count + 1,
          name: data.customerName,
          email: data.email || '',
          mobile: data.mobile || '',
          address: data.address || "N/A",
          partner: data.partner
        });
        const savedCustomer = await newCustomer.save();
        customerId = savedCustomer._id;
      }
    }

    // --- Map Data to LIC Schema ---
    const licData = {
      customer: customerId,
      customerName: data.customerName,
      partner: data.partner,
      dealerName: data.dealerName,
      insCompany: data.insCompany, // Aligned with model
      planName: data.planName,
      plans: data.plans,
      policyNo: data.policyNo,
      endorsementNo: data.endorsementNo,
      payMode: data.payMode,
      insuranceYear: data.insuranceYear,
      policyIssueDate: toSafeDate(data.policyIssueDate), // Aligned
      startDate: toSafeDate(data.startDate),
      maturityDate: toSafeDate(data.maturityDate),
      premiumDueDate: toSafeDate(data.premiumDueDate),
      premium: data.premium,
      netPremium: data.netPremium,
      sumAssured: data.sumAssured,
      premiumPayingTerm: data.premiumPayingTerm,
      pptInYears: data.pptInYears,
      status: data.status || 'Issued', // Aligned
      familyMembers: data.familyMembers,
      previousPolicy: data.previousPolicy,
      amountReceived: data.amountReceived, // Aligned
      attachments: data.attachments
    };

    const newLicEntry = await LICEntry.create(licData);
    res.status(201).json({ success: true, message: "LIC policy saved successfully.", data: newLicEntry });

  } catch (err) {
    console.error("Error in saveLIC:", err);
    res.status(500).json({ success: false, message: "An error occurred on the server while saving." });
  }
}

// ==========================================
// UPDATE LIC POLICY
// ==========================================
export async function updateLIC(req, res) {
    try {
        const { id } = req.params;
        const data = req.body;

        // --- Map Data to LIC Schema for update ---
        const updateData = {
          partner: data.partner,
          dealerName: data.dealerName,
          insCompany: data.insCompany,
          planName: data.planName,
          plans: data.plans,
          policyNo: data.policyNo,
          endorsementNo: data.endorsementNo,
          payMode: data.payMode,
          insuranceYear: data.insuranceYear,
          policyIssueDate: toSafeDate(data.policyIssueDate),
          startDate: toSafeDate(data.startDate),
          maturityDate: toSafeDate(data.maturityDate),
          premiumDueDate: toSafeDate(data.premiumDueDate),
          premium: data.premium,
          netPremium: data.netPremium,
          sumAssured: data.sumAssured,
          premiumPayingTerm: data.premiumPayingTerm,
          pptInYears: data.pptInYears,
          status: data.status,
          familyMembers: data.familyMembers,
          previousPolicy: data.previousPolicy,
          amountReceived: data.amountReceived,
          attachments: data.attachments
        };

        const updatedEntry = await LICEntry.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        if (!updatedEntry) {
            return res.status(404).json({ success: false, message: "Record not found" });
        }

        res.json({ success: true, message: "LIC policy updated successfully.", data: updatedEntry });
    } catch (err) {
        console.error("Error in updateLIC:", err);
        res.status(500).json({ success: false, message: "An error occurred on the server while updating." });
    }
}

// ==========================================
// GET RECENT 10 LIC POLICIES
// ==========================================
export async function getRecentLIC(req, res) {
  try {
    const recentEntries = await LICEntry.find()
      .populate("customer", "name") // Populate customer's name
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(); // Use .lean() for faster, plain JS objects

    res.json({ success: true, data: recentEntries });
  } catch (err) {
    console.error("Error in getRecentLIC:", err);
    res.status(500).json({ success: false, message: "Failed to fetch recent records." });
  }
}

// ==========================================
// GET LIC POLICY BY ID
// ==========================================
export async function getLICById(req, res) {
  try {
    const licEntry = await LICEntry.findById(req.params.id)
      .populate("customer") // Populate full customer object
      .lean();

    if (!licEntry) {
        return res.status(404).json({ success: false, message: "Record not found" });
    }

    res.json({ success: true, data: licEntry });
  } catch (err) {
    console.error("Error in getLICById:", err);
    res.status(500).json({ success: false, message: "Failed to fetch record." });
  }
}

// ==========================================
// DELETE LIC POLICY
// ==========================================
export async function deleteLIC(req, res) {
  try {
    const { id } = req.params;
    const deletedEntry = await LICEntry.findByIdAndDelete(id);

    if (!deletedEntry) {
      return res.status(404).json({ success: false, message: "Record not found to delete." });
    }

    res.json({ success: true, message: "Record deleted successfully." });
  } catch (err) {
    console.error("Error in deleteLIC:", err);
    res.status(500).json({ success: false, message: "An error occurred during deletion." });
  }
}
