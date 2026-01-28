import NonMotorEntry from "../models/nonmotorentry.js";
import Customer from "../models/customer.js";

export async function uploadNonMotorFile(req, res) {
  try {
    const { id, type } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    const entry = await NonMotorEntry.findById(id);
    if (!entry) {
      return res.status(404).json({ success: false, message: "Entry not found." });
    }

    const filePath = req.file.path.replace(/\\/g, "/").replace("backend/", "");

    if (type === 'policy') {
      entry.attachments.policy = filePath;
    } else if (type === 'proposal') {
      entry.attachments.proposal = filePath;
    } else if (type === 'kyc') {
      entry.attachments.kyc = filePath;
    } else {
      return res.status(400).json({ success: false, message: "Invalid upload type." });
    }

    await entry.save();

    res.json({ success: true, message: "File uploaded successfully.", filePath, entry });
  } catch (err) {
    console.error("UPLOAD NONMOTOR FILE ERROR:", err);
    res.status(500).json({ success: false, message: "Server error during file upload." });
  }
}

export async function saveNonMotor(req, res) {
    try {
        const data = req.body;

        // 1. Validation
        if (!data.policyNo || !data.customerName) {
            return res.status(400).json({ success: false, message: "Policy No & Customer Name required" });
        }

        // 2. Customer Handle
        let customerId = data.customerId;
        if (!customerId || customerId === "" || customerId === "undefined") {
            const nextSno = (await Customer.countDocuments()) + 1;
            const cust = new Customer({
                sno: nextSno,
                name: data.customerName,
                email: data.customerEmail || "",
                mobile: data.customerMobile || "",
                address: data.customerAddress || "",
                partner: data.partner || "",
            });
            await cust.save();
            customerId = cust._id;
        }

        // 3. Create Policy Entry
        const nm = new NonMotorEntry({
            customer: customerId,
            customerName: data.customerName,
            product: data.product,
            policyNo: data.policyNo,
            policyType: data.policyType,

            // Date Parsing with safety brackets
            issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
            startDate: (data.startDate && data.startDate !== "") ? new Date(data.startDate) : null,
            endDate: (data.endDate && data.endDate !== "") ? new Date(data.endDate) : null,

            // Numeric fields protection
            sumInsured: parseFloat(data.sumInsured) || 0,
            netPremium: parseFloat(data.netPremium) || 0,
            gst: parseFloat(data.gst) || 0,
            totalPremium: parseFloat(data.totalPremium) || 0,

            dealerName: data.dealerName || "",
            insuranceCompany: data.insuranceCompany,
            previousPolicy: data.previousPolicy || {},
            payment: data.payment || {},
            attachments: data.attachments || {}
        });

        await nm.save();
        res.json({ success: true, message: "Non-Motor Policy Saved Successfully", data: nm });

    } catch (err) {
        console.error("SAVE NONMOTOR ERROR:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

// ✅ GET RECENT ENTRIES (For Table)
export async function getRecentNonMotor(req, res) {
    try {
        const list = await NonMotorEntry.find().sort({ createdAt: -1 }).limit(10);
        res.json({ success: true, data: list });
    } catch (err) {
        console.error("FETCH ERROR:", err);
        res.status(500).json({ success: false, message: "Fetch failed" });
    }
}

// ✅ GET SINGLE ENTRY (For Edit Mode)
export async function getNonMotorById(req, res) {
    try {
        const data = await NonMotorEntry.findById(req.params.id);
        if (!data) return res.status(404).json({ success: false, message: "Record not found" });
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
}

// ✅ UPDATE ENTRY
export async function updateNonMotor(req, res) {
    try {
        const updated = await NonMotorEntry.findByIdAndUpdate(
            req.params.id, 
            { $set: req.body }, 
            { new: true }
        );
        res.json({ success: true, message: "Updated successfully", data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: "Update failed" });
    }
}

// ✅ DELETE ENTRY
export async function deleteNonMotor(req, res) {
    try {
        await NonMotorEntry.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Entry deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Delete failed" });
    }
}