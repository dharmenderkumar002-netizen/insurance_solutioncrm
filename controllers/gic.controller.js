import GICEntry from "../models/gicentry.js";
import Customer from "../models/customer.js";
import Master from "../models/master.model.js"; 

// ==========================================
// 1. ADVANCED AUTOCOMPLETE
// ==========================================
export async function autocomplete(req, res) {
  try {
    const q = (req.query.q || "").trim();
    
    if (!q) return res.json({ gics: [], customers: [] });

    const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(safeQ, "i"); 
    
    // 1. Find Customers
    const customers = await Customer.find({ 
        $or: [ { name: re }, { mobile: re } ] 
    })
    .select('name mobile email address sno')
    .limit(10)
    .lean();

    // 2. Find GIC Entries
    const customerIds = customers.map(c => c._id);

    const gics = await GICEntry.find({
      $or: [
        { policyNo: re }, 
        { engineNo: re }, 
        { chassisNo: re }, 
        { vehicleNo: re }, 
        { vehicleName: re },
        { customer: { $in: customerIds } }
      ]
    })
    .populate("customer", "name mobile address") 
    .populate("partner", "name")
    .populate("product", "name") 
    .select("vehicleNo insuranceYear odStartDate customer partner product gicProduct engineNo chassisNo policyNo") 
    .limit(10)
    .lean();

    res.json({ gics, customers });

  } catch (err) { 
    console.error("❌ Autocomplete Error:", err); 
    res.status(500).json({ gics: [], customers: [] }); 
  }
}

// ==========================================
// 2. GET GIC BY ID
// ==========================================
export async function getGICById(req, res) {
  try {
    const item = await GICEntry.findById(req.params.id)
      .populate("customer") 
      .populate("partner", "name")
      .populate("product") 
      .lean();

    if (!item) return res.status(404).json({ error: "Record not found" });
    res.json(item);
  } catch (err) { 
    console.error("GetById Error:", err); 
    res.status(500).json({ error: "Server error" }); 
  }
}

// ==========================================
// 3. GET ALL GIC RECORDS
// ==========================================
export async function getGICRecords(req, res) {
  try {
    const list = await GICEntry.find()
      .populate("customer", "name") 
      .populate("partner", "name")
      .populate("product", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: list });
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// ==========================================
// 4. GET RECENT 10 GIC
// ==========================================
export async function getRecentGIC(req, res) {
  try {
    const list = await GICEntry.find()
      .populate("customer", "name") 
      .populate("partner", "name")
      .populate("product", "name")
      .sort({ createdAt: -1 }) 
      .limit(10) 
      .lean();

    res.json({ success: true, data: list });
  } catch (err) {
    console.error("Recent Fetch Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// ==========================================
// 5. DELETE GIC FUNCTION
// ==========================================
export async function deleteGIC(req, res) {
  try {
    const { id } = req.params;
    await GICEntry.findByIdAndDelete(id);
    res.json({ success: true, message: "Record deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
}

// ==========================================
// 6. SAVE GIC FUNCTION (MERGED & FIXED)
// ==========================================
export async function saveGIC(req, res) {
    try {
        console.log("📩 Final Payload to Save:", req.body);
        const payload = req.body;

        // --- 1. BASIC VALIDATION ---
        if (!payload.policyNo) return res.status(400).json({ error: "Policy No is required" });
        if (!payload.vehicleNo) return res.status(400).json({ error: "Vehicle No is required" });
        if (!payload.insuranceYear) return res.status(400).json({ error: "Insurance Year is required" });

        // --- 2. DUPLICATE CHECK LOGIC ---
        // Check: Same Year + (Vehicle OR Engine OR Chassis)
        const duplicateQuery = {
            insuranceYear: payload.insuranceYear,
            $or: []
        };

        if (payload.vehicleNo) duplicateQuery.$or.push({ vehicleNo: payload.vehicleNo.trim().toUpperCase() });
        if (payload.engineNo) duplicateQuery.$or.push({ engineNo: payload.engineNo.trim().toUpperCase() });
        if (payload.chassisNo) duplicateQuery.$or.push({ chassisNo: payload.chassisNo.trim().toUpperCase() });

        if (duplicateQuery.$or.length > 0) {
            const existingRecord = await GICEntry.findOne(duplicateQuery);
            if (existingRecord) {
                // Agar Naya Record hai (no ID) YA ID match nahi karti (different record)
                // Note: payload._id edit mode me aata hai
                
                const isEditMode = payload._id && (existingRecord._id.toString() === payload._id);
                
                // Agar Edit nahi kar rahe, aur record mil gaya -> Duplicate hai
                if (!isEditMode) {
                     return res.status(400).json({ 
                        error: `RECORD ALREADY EXISTS! Year ${payload.insuranceYear} (Policy: ${existingRecord.policyNo})` 
                    });
                }
            }
        }

        // --- 3. PRODUCT LOGIC ---
        if (payload.gicProductId) {
            payload.product = payload.gicProductId;
        }
        if (payload.product && (!payload.gicProduct || payload.gicProduct === "-")) {
            const masterProd = await Master.findById(payload.product);
            if (masterProd) payload.gicProduct = masterProd.name;
        }

        // --- 4. PARTNER LOGIC ---
        let partnerId = payload.partner;
        const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
        
        if (partnerId && !isValidObjectId(partnerId)) {
            const partnerRecord = await Master.findOne({ type: "partner", name: partnerId });
            partnerId = partnerRecord ? partnerRecord._id : null;
        }

        // --- 5. CUSTOMER LOGIC ---
        let customerId = payload.customerId;
        if ((!customerId || customerId === "") && payload.customerName) {
            if (!payload.customerMobile) {
                return res.status(400).json({ error: "Mobile Number is required for New Customer" });
            }
            const existingCust = await Customer.findOne({ mobile: payload.customerMobile });
            if (existingCust) {
                customerId = existingCust._id;
            } else {
                const count = await Customer.countDocuments();
                const cust = new Customer({
                    sno: count + 1,
                    name: payload.customerName,
                    email: payload.customerEmail,
                    mobile: payload.customerMobile,
                    address: payload.address || "N/A"
                });
                const savedCust = await cust.save();
                customerId = savedCust._id;
            }
        }

        // --- 6. DATA MAPPING (Clean Object) ---
        const parseDate = (d) => (d && d !== "") ? new Date(d) : null;

        const gicData = {
            // Relations
            customer: customerId,
            partner: partnerId,
            product: payload.product, 

            // Search/Report Strings
            gicProduct: payload.gicProduct,
            dealerName: payload.dealerName,
            insCompany: payload.insCompany,

            // Core Details
            policyNo: payload.policyNo,
            policyType: payload.policyType,
            coverageType: payload.coverageType,
            vehicleNo: payload.vehicleNo ? payload.vehicleNo.trim().toUpperCase() : "",
            vehicleName: payload.vehicleName,
            fuel: payload.fuel,
            vehicleRegDate: parseDate(payload.vehicleRegDate),
            insuranceYear: payload.insuranceYear,
            ncb: payload.ncb,
            policyIssueDate: parseDate(payload.policyIssueDate) || new Date(),
            
            // Dates
            odStartDate: parseDate(payload.odStartDate),
            odEndDate: parseDate(payload.odEndDate),
            tpStartDate: parseDate(payload.tpStartDate),
            tpEndDate: parseDate(payload.tpEndDate),

            // Finance
            idv: payload.idv,
            premium: payload.premium,
            odPremium: Number(payload.odpremium || payload.odPremium || 0), 
            netPremium: Number(payload.netpremium || payload.netPremium || 0),
            discount: payload.discount,

            // Vehicle
            engineNo: payload.engineNo ? payload.engineNo.trim().toUpperCase() : "",
            chassisNo: payload.chassisNo ? payload.chassisNo.trim().toUpperCase() : "",
            ccKwGvw: payload.ccKwGvw,
            vehicleClass: payload.vehicleClass,

            // Extras
            pa: payload.pa,
            paToPass: payload.patopass || payload.paToPass,
            paTaxi: payload.paTaxi,
            trailorType: payload.trailorType,

            // ✅ NESTED PAYMENT
            amountReceived: {
                amount: Number(payload.premiumamt || 0),
                date: parseDate(payload.amountDate),
                paymentMode: payload.paymentMode || '',
                chequeDd: payload.chequeDd || '',
                bankName: payload.bankName || ''
            },

            // ✅ NESTED PREVIOUS POLICY
            previousPolicy: {
                insCo: payload.pypInsCo || '',
                endDate: parseDate(payload.pypEndDate),
                previousPolicyNo: payload.previousPolicyNo || ''
            }
        };

        // --- 7. SAVE OR UPDATE ---
        // Hum findOneAndUpdate use karenge Policy No ke base par
        // Isse agar user Edit kar raha hai ya naya bana raha hai, dono handle ho jayega
        
        const result = await GICEntry.findOneAndUpdate(
            { policyNo: payload.policyNo, insuranceYear: payload.insuranceYear }, // Criteria
            gicData, 
            { upsert: true, new: true, runValidators: true }
        )
        .populate("customer", "name")
        .populate("partner", "name");

        console.log("✅ Policy Saved/Updated:", result.policyNo);
        
        return res.json({ 
            success: true, 
            message: "Policy Saved Successfully", 
            data: result,
            productSaved: result.gicProduct
        });

    } catch (error) {
        console.error("❌ SAVE FAILED:", error.message);
        res.status(500).json({ success: false, error: "Server Error: " + error.message });
    }
}