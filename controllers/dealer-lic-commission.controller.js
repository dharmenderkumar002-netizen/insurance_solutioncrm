import DealerLICCommission from "../models/dealerliccommission.js";

// Helper: Normalize Date to ddmmyyyy
const getCleanDate = (dateInput) => {
  if (!dateInput) return null;
  const clean = dateInput.replace(/[^0-9]/g, "");
  // Handle yyyy-mm-dd
  if (dateInput.includes("-") && clean.length === 8 && dateInput.indexOf("-") < 5) {
    const y = clean.substring(0, 4);
    const m = clean.substring(4, 6);
    const d = clean.substring(6, 8);
    return `${d}${m}${y}`;
  }
  return clean.length === 8 ? clean : null;
};

/* ================= SAVE ================= */
export const saveLICBreakdown = async (req, res) => {
  try {
    const { dealerName, commissionDate, items } = req.body;

    const dateKey = getCleanDate(commissionDate);

    if (!dealerName || !dateKey) {
      return res.status(400).json({ success: false, message: "Dealer & Date required (ddmmyyyy)" });
    }

    // Upsert Logic (Update if exists, Insert if new)
    await DealerLICCommission.findOneAndUpdate(
      { dealerName, commissionDate: dateKey },
      { 
        $set: { 
          dealerName, 
          commissionDate: dateKey, 
          items,
          updatedAt: new Date()
        } 
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, message: "LIC Commission saved successfully" });
  } catch (err) {
    console.error("LIC SAVE ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ================= GET ================= */
export const getLICBreakdown = async (req, res) => {
  try {
    const { dealerName, date, fetchLatest } = req.query;
    
    if (!dealerName) return res.json({ success: true, data: [] });

    // Fetch Latest
    if (fetchLatest === "true") {
       const latest = await DealerLICCommission.findOne({ dealerName }).sort({ updatedAt: -1 });
       return res.json({ success: true, data: latest ? latest.items : [] });
    }

    const cleanDate = getCleanDate(date);
    const data = await DealerLICCommission.findOne({ dealerName, commissionDate: cleanDate });
    
    res.json({ success: true, data: data ? data.items : [] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching data" });
  }
};

/* ================= LIST ALL RULES (For LIC Entry Page) ================= */
export const listAllLICDealerRules = async (req, res) => {
  try {
    const allRules = await DealerLICCommission.find({}).lean();
    res.json({ success: true, data: allRules });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error listing all LIC dealer rules" });
  }
};

/* ================= LIST (Dashboard Fix) ================= */
export const listLICDealers = async (req, res) => {
  try {
    const { dealerName } = req.query;
    let query = {};
    if(dealerName) query.dealerName = dealerName;

    const list = await DealerLICCommission.find(query).sort({ updatedAt: -1 });

    // 🔥 MAP date for Dashboard
    const cleanList = list.map(item => ({
        _id: item._id,
        dealerName: item.dealerName,
        commissionDate: item.commissionDate,
        date: item.commissionDate // Fixes Undefined on Dashboard
    }));

    res.json({ success: true, data: cleanList });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error listing entries" });
  }
};

/* ================= DELETE ================= */
export const deleteLICEntry = async (req, res) => {
  try {
    const { dealerName, date } = req.body;
    const dateKey = getCleanDate(date);
    
    await DealerLICCommission.deleteOne({ 
        dealerName, 
        commissionDate: dateKey 
    });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};

/* ================= ✅ NEW ADDED: GET LATEST DEALER (For LIC Entry Page) ================= */
export const getLatestLICDealer = async (req, res) => {
    try {
        const { product, startDate } = req.query; // product = Plan Name, startDate = YYYYMMDD or ddmmyyyy

        if (!product || !startDate) {
            return res.status(400).json({ success: false, message: "Plan and Start Date are required" });
        }

        // 1. Find dealers who have this Plan
        // Note: Since your date format is ddmmyyyy, direct $lte sorting might be tricky.
        // We will fetch matching plans and filter in JS to be safe.
        const matches = await DealerLICCommission.find({
            "items.planName": product
        });

        if (!matches || matches.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const uniqueDealers = {};
        const result = [];

        // 2. Filter & Sort Logic
        // Convert dates to comparable format if needed or just use logic
        matches.sort((a, b) => b.commissionDate.localeCompare(a.commissionDate)); // Sort Descending

        for (const doc of matches) {
            // Check if Commission Date <= Policy Start Date (Simple string comparison for now)
            // Note: For strict accuracy, ensure formats match (YYYYMMDD is best for comparison)
            
            // Only add if we haven't added this dealer yet (gets the latest rule)
            if (!uniqueDealers[doc.dealerName]) {
                uniqueDealers[doc.dealerName] = true;
                
                // Find specific plan details
                const planDetails = doc.items.find(i => i.planName === product);

                result.push({
                    dealerName: doc.dealerName,
                    company: 'LIC',
                    commissionDate: doc.commissionDate,
                    commissionDetails: planDetails
                });
            }
        }

        res.json({ success: true, data: result });

    } catch (error) {
        console.error("Error fetching latest LIC dealer:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};