import DealerExpense from "../models/dealerexpense.js";
import PartnerExpense from "../models/partnerexpense.js";
import GICEntry from "../models/gicentry.js";
import Customer from "../models/customer.js"; 
import Master from "../models/master.model.js"; 

/* =========================================================
   HELPERS (SCORING & RANGE PARSING)
========================================================= */
const normalize = (v) => String(v || "").trim().toLowerCase();

/**
 * Robust Range Parser
 * Handles: "0-100", "1500-Max", "All", "0-2000%"
 */
const parseRange = (rangeStr) => {
    const s = normalize(rangeStr).replace(/%/g, "");
    
    if (!s || s === "all" || s === "") return { min: 0, max: Infinity };

    const parts = s.split("-");
    const min = parseFloat(parts[0]) || 0;
    // Handle "2000-Max" or just "2000" (treated as min)
    const max = (!parts[1] || parts[1].includes("max")) ? Infinity : parseFloat(parts[1]);
    
    return { min, max };
};

/**
 * Weighted Scoring Logic
 * exact match = weight
 * wildcard ("all") = 1
 * mismatch = -1
 */
const scoreField = (ruleVal, policyVal, weight) => {
    const r = normalize(ruleVal);
    const p = normalize(policyVal);

    if (r === "all" || r === "") return 1; // Wildcard
    if (r === p) return weight;            // Exact Match
    return -1;                             // Mismatch
};

/* =========================================================
   1. SAVE BREAKDOWN (With Duplicate Cleanup)
========================================================= */
export const saveBreakdown = async (req, res) => {
    try {
        const { dealerName, commissionDate, items } = req.body;
        
        if (!dealerName || !commissionDate) {
            return res.status(400).json({ success: false, message: "Dealer Name and Date are required" });
        }

        const safeDealerName = dealerName.trim();
        
        // Define Day Start and End to ensure we overwrite existing entries for that day
        const dateObj = new Date(commissionDate);
        const startDate = new Date(dateObj); startDate.setHours(0,0,0,0);
        const endDate   = new Date(dateObj); endDate.setHours(23,59,59,999);

        // Delete existing entry for this specific day
        await DealerExpense.deleteMany({
            dealer: safeDealerName,
            expenseType: "gic_breakdown",
            date: { $gte: startDate, $lte: endDate }
        });

        // Save new entry
        await new DealerExpense({
            dealer: safeDealerName,
            expenseType: "gic_breakdown",
            date: dateObj,
            remarks: `Commission breakdown updated on ${new Date().toLocaleDateString()}`,
            breakdownItems: items.map(item => ({
                ...item,
                // Ensure backend compatibility if frontend sends one but not the other
                OnNet: item.OnNet || item.percentOnNet || false,
                percentOnNet: item.OnNet || item.percentOnNet || false
            }))
        }).save();

        res.status(201).json({ success: true, message: "Commission Breakdown Saved Successfully!" });
    } catch (error) {
        console.error("Save Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addDealerExpense = saveBreakdown;

/* =========================================================
   2. DELETE ENTRY
========================================================= */
export const deleteEntry = async (req, res) => {
    try {
        const { dealerName, date } = req.body;
        if (!date) return res.status(400).json({ success: false, message: "Date is required" });

        const startDate = new Date(date); startDate.setHours(0,0,0,0);
        const endDate   = new Date(date); endDate.setHours(23,59,59,999);

        await DealerExpense.deleteMany({
            dealer: dealerName,
            expenseType: "gic_breakdown",
            date: { $gte: startDate, $lte: endDate }
        });

        res.json({ success: true, message: "Deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================================================
   3. LIST & GET BREAKDOWN
========================================================= */
import DealerGICCommission from "../models/dealergiccommission.js";

// ... (rest of the file is the same until listDealerExpenses)

export const listDealerExpenses = async (req, res) => {
    try {
        // The frontend expects the full breakdown records to filter by product and date.
        // The previous implementation was returning a summarized list without the necessary `breakdownItems`.
        const records = await DealerExpense.find({ expenseType: "gic_breakdown" }).lean();
        
        res.json({ success: true, data: records });

    } catch (error) {
        console.error("List Dealer Expenses Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getBreakdown = async (req, res) => {
    try {
        const { dealerName, date, fetchLatest } = req.query;

        // --- Logic for DealerExpense Model ---
        let query = { dealer: dealerName, expenseType: "gic_breakdown" };
        let record = null;

        if (fetchLatest === "true") {
            record = await DealerExpense.findOne(query).sort({ date: -1 }).lean();
        } else if (date) {
            const targetDate = new Date(date);
            targetDate.setHours(23, 59, 59, 999); // Set to end of day
            query.date = { $lte: targetDate };
            record = await DealerExpense.findOne(query).sort({ date: -1 }).lean();
        }

        if (record && record.breakdownItems) {
            return res.json({ success: true, data: record.breakdownItems });
        }

        // --- FALLBACK: Logic for DealerGICCommission Model ---
        // If no data found, try the other model. This handles the inconsistency.
        const gicQuery = { dealerName: dealerName };
        let gicRecord = null;
        
        const parseDateKey = (dStr) => {
            if (!dStr || dStr.length !== 8) return 0;
            const d = parseInt(dStr.substring(0, 2));
            const m = parseInt(dStr.substring(2, 4));
            const y = parseInt(dStr.substring(4, 8));
            return new Date(y, m - 1, d).getTime();
        };

        if (fetchLatest === "true") {
            const allRecords = await DealerGICCommission.find(gicQuery).lean();
            allRecords.sort((a, b) => parseDateKey(b.commissionDate) - parseDateKey(a.commissionDate));
            gicRecord = allRecords.length > 0 ? allRecords[0] : null;

        } else if (date) {
            const targetDate = new Date(date);
            targetDate.setHours(23, 59, 59, 999);

            const allRecords = await DealerGICCommission.find(gicQuery).lean();
            const sortedRecords = allRecords
                .map(r => {
                    // The parseDateKey function already exists and returns a timestamp
                    r.parsedDate = parseDateKey(r.commissionDate);
                    return r;
                })
                .filter(r => r.parsedDate && r.parsedDate <= targetDate.getTime())
                .sort((a, b) => b.parsedDate - a.parsedDate);
            
            gicRecord = sortedRecords.length > 0 ? sortedRecords[0] : null;
        }

        if (gicRecord && gicRecord.items) {
            // To maintain compatibility, we might need to send back the date
            // The frontend for this page re-fetches with fetchLatest=true if date not found
            return res.json({ success: true, data: gicRecord.items });
        }

        // If nothing found in either model
        res.json({ success: true, data: [] });

    } catch (error) {
        console.error("Get Breakdown Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================================================
   4. GENERATE GIC COMMISSION REPORT (CORE LOGIC)
========================================================= */
export const getDealerCommissionReport = async (req, res) => {
    try {
        const { dealers, companies, fromDate, toDate, search } = req.body;

        // 1. Build Query
        let query = {};
        if (dealers?.length) query.dealerName = { $in: dealers };
        if (companies?.length) query.insCompany = { $in: companies };
        if (fromDate && toDate) {
            query.odStartDate = { $gte: new Date(fromDate), $lte: new Date(toDate) };
        }

        if (search) {
            const regex = new RegExp(search, "i");
            const customers = await Customer.find({
                $or: [{ name: regex }, { mobile: regex }]
            }).select("_id");

            query.$or = [
                { policyNo: regex },
                { vehicleNo: regex },
                { customer: { $in: customers.map(c => c._id) } }
            ];
        }

        // 2. Fetch Policies
        const policies = await GicEntry.find(query)
            .populate("customer", "name")
            .lean();

        // 3. Fetch Rules & OPTIMIZE: Group rules by Dealer in a Map
        // This avoids looping through all rules for every policy (O(1) lookup)
        const allRulesRaw = await DealerExpense.find({
            dealer: { $in: dealers },
            expenseType: "gic_breakdown"
        }).sort({ date: -1 }).lean();

        const dealerRulesMap = {};
        // Only keep the latest rule set per dealer if multiple exist
        allRulesRaw.forEach(r => {
            if (!dealerRulesMap[r.dealer]) {
                dealerRulesMap[r.dealer] = r.breakdownItems || [];
            }
        });

        // 4. Process Each Policy
        const reportData = policies.map(policy => {
            const rules = dealerRulesMap[policy.dealerName] || [];
            const pName = normalize(policy.gicProduct || "");
            const pFuel = normalize(policy.fuelType || "");
            const pModel = normalize(policy.vehicleName || ""); // Assuming vehicleName stores model
            const pType = normalize(policy.policyType || "");   // Coverage: Comprehensive/ThirdParty
            
            // Clean RTO: "DL-10" -> "dl10"
            const pRTO = normalize(policy.vehicleNo || "").replace(/[^a-z0-9]/g, "").substring(0, 4);

            let matchedRule = null;

            if (rules.length > 0) {
                // Determine Policy Numeric Values
                const pCC = parseFloat(String(policy.ccKwGvw || "0").replace(/[^0-9.]/g, "")) || 0;
                const pNCB = parseFloat(String(policy.ncb || "0").replace(/[^0-9.]/g, "")) || 0;

                const scoredRules = rules.map(rule => {
                    // A. STRICT Range Checks (Pass/Fail)
                    const rCC = parseRange(rule.ccRange);
                    if (pCC < rCC.min || pCC > rCC.max) return null;

                    const rNCB = parseRange(rule.ncbRange);
                    if (pNCB < rNCB.min || pNCB > rNCB.max) return null;

                    // B. SCORING Matches
                    const sCompany = scoreField(rule.company, policy.insCompany, 100);
                    const sProduct = scoreField(rule.product, pName, 500);
                    const sFuel = scoreField(rule.fuel, pFuel, 1000);
                    const sModel = scoreField(rule.vehicleModel, pModel, 200);
                    
                    // Added Coverage Score (Vital for correct calculation)
                    const sCoverage = scoreField(rule.coverage, pType, 150); 

                    // RTO Logic (Partial Match)
                    let sRTO = 0;
                    const rRTO = normalize(rule.rto).replace(/[^a-z0-9]/g, "");
                    if (rRTO && rRTO !== "all") {
                        if (pRTO.includes(rRTO)) sRTO = 2000; // High priority for specific RTO
                        else return null; // Failed specific RTO check
                    } else {
                        sRTO = 1; // "All"
                    }

                    // If any core field mismatched (returned -1), discard rule
                    if ([sCompany, sProduct, sFuel, sModel, sCoverage].some(s => s < 0)) return null;

                    return { 
                        rule, 
                        totalScore: sCompany + sProduct + sFuel + sModel + sRTO + sCoverage 
                    };
                }).filter(Boolean); // Remove nulls

                // Sort by highest score and pick top 1
                if (scoredRules.length) {
                    scoredRules.sort((a, b) => b.totalScore - a.totalScore);
                    matchedRule = scoredRules[0].rule;
                }
            }

            // 5. Calculate Commission
            const odPremium = parseFloat(policy.odPremium) || 0;
            const netPremium = parseFloat(policy.netPremium) || 0;

            let commPercent = 0, fixed = 0, commAmt = 0, calcOn = "NA";

            if (matchedRule) {
                commPercent = parseFloat(matchedRule.percent) || 0;
                fixed = parseFloat(matchedRule.fixed) || 0;

                // Check both flags (Frontend might send either)
                const isNet = matchedRule.OnNet === true || matchedRule.percentOnNet === true;

                if (isNet) {
                    commAmt = (netPremium * commPercent / 100) + fixed;
                    calcOn = "NET";
                } else {
                    commAmt = (odPremium * commPercent / 100) + fixed;
                    calcOn = "OD";
                }
            }

            return {
                _id: policy._id,
                date: policy.odStartDate,
                dealerName: policy.dealerName,
                policyNo: policy.policyNo,
                vehicleNo: policy.vehicleNo,
                customerName: policy.customer?.name || "Unknown",
                gicProduct: pName.toUpperCase(),
                insCompany: policy.insCompany,
                netPremium,
                odPremium,
                calcOn,
                commPercent,
                fixed,
                commAmt: parseFloat(commAmt.toFixed(2)),
                status: matchedRule ? "Calculated" : "No Rule"
            };
        });

        res.json({ success: true, data: reportData });
    } catch (error) {
        console.error("Report Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================================================
   5. PLACEHOLDERS
========================================================= */

// 5.1 SAVE PARTNER EXPENSE (With Validation: Partner % <= Dealer %)
export const addPartnerExpense = async (req, res) => {
    try {
        const { partnerId, dealerName, date, items } = req.body;

        if (!partnerId || !dealerName || !date) {
            return res.status(400).json({ success: false, message: "Partner, Dealer, and Date are required" });
        }

        // 1. Fetch Dealer Rules (Source of Truth)
        const startDate = new Date(date); startDate.setHours(0,0,0,0);
        const endDate   = new Date(date); endDate.setHours(23,59,59,999);

        const dealerRecord = await DealerExpense.findOne({
            dealer: dealerName,
            expenseType: "gic_breakdown",
            date: { $gte: startDate, $lte: endDate }
        });

        if (!dealerRecord) {
            return res.status(400).json({ success: false, message: "Dealer rules not found for this date." });
        }

        // 2. Validate & Prepare Items
        const validItems = items.map(item => {
            // Find matching rule in Dealer Record to check limit
            // Matching logic: Company + Product + Coverage + Fuel + Model
            const dealerRule = dealerRecord.breakdownItems.find(r => 
                normalize(r.company) === normalize(item.company) &&
                normalize(r.product) === normalize(item.product) &&
                normalize(r.coverage) === normalize(item.coverage) &&
                normalize(r.fuel) === normalize(item.fuel) &&
                normalize(r.vehicleModel) === normalize(item.vehicleModel)
            );

            const dealerPct = dealerRule ? (parseFloat(dealerRule.percent) || 0) : 0;
            const partnerPct = parseFloat(item.partnerPercent) || 0;

            if (partnerPct > dealerPct) {
                throw new Error(`Partner % (${partnerPct}) cannot exceed Dealer % (${dealerPct}) for ${item.company} - ${item.product}`);
            }

            return {
                ...item,
                dealerPercent: dealerPct, // Snapshot
                partnerPercent: partnerPct
            };
        });

        // 3. Save / Update
        await PartnerExpense.findOneAndUpdate(
            { partner: partnerId, dealer: dealerName, date: { $gte: startDate, $lte: endDate } },
            {
                partner: partnerId,
                dealer: dealerName,
                date: new Date(date),
                breakdownItems: validItems,
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        res.json({ success: true, message: "Partner Commission Saved Successfully" });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 5.2 LIST PARTNERS (For the main table)
export const listPartnerExpenses = async (req, res) => {
    try {
        // Fetch all partners from Master
        const partners = await Master.find({ type: "partner" }).select("name mobile status").lean();
        res.json({ success: true, data: partners });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5.3 GET PARTNER RULES (Merge Dealer Rules + Existing Partner %)
export const getPartnerExpenses = async (req, res) => {
    try {
        const { partnerId, dealerName, date } = req.query;
        
        if (!dealerName || !date) return res.json({ success: true, data: [] });

        const startDate = new Date(date); startDate.setHours(0,0,0,0);
        const endDate   = new Date(date); endDate.setHours(23,59,59,999);

        // 1. Get Dealer Rules (Base)
        const dealerRecord = await DealerExpense.findOne({
            dealer: dealerName,
            expenseType: "gic_breakdown",
            date: { $gte: startDate, $lte: endDate }
        }).lean();

        if (!dealerRecord) return res.json({ success: true, data: [] });

        // 2. Get Existing Partner Rules (If any)
        const partnerRecord = await PartnerExpense.findOne({
            partner: partnerId,
            dealer: dealerName,
            date: { $gte: startDate, $lte: endDate }
        }).lean();

        // 3. Merge
        const mergedItems = dealerRecord.breakdownItems.map(dItem => {
            // Find match in partner record
            const pItem = partnerRecord?.breakdownItems?.find(p => 
                normalize(p.company) === normalize(dItem.company) &&
                normalize(p.product) === normalize(dItem.product) &&
                normalize(p.coverage) === normalize(dItem.coverage) &&
                normalize(p.fuel) === normalize(dItem.fuel)
            );

            return {
                ...dItem,
                dealerPercent: dItem.percent, // Explicitly label dealer percent
                partnerPercent: pItem ? pItem.partnerPercent : 0 // Default to 0 if not set
            };
        });

        // 4. Sort: Company -> Product (GCV) -> Coverage
        mergedItems.sort((a, b) => {
            const cA = normalize(a.company), cB = normalize(b.company);
            if (cA !== cB) return cA.localeCompare(cB);

            const pA = normalize(a.product), pB = normalize(b.product);
            if (pA !== pB) return pA.localeCompare(pB);

            const covA = normalize(a.coverage), covB = normalize(b.coverage);
            return covA.localeCompare(covB);
        });

        res.json({ success: true, data: mergedItems });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const saveExpenseSettings = async (req, res) => res.json({ success: true });
export const getExpenseSettings = async (req, res) => res.json({ success: true });