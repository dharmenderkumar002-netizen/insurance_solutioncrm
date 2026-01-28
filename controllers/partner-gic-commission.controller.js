import PartnerGICCommission from "../models/partnergiccommission.js";
import DealerExpense from "../models/dealerexpense.js";
import mongoose from "mongoose";
import Partner from "../models/partner.js";
import GicEntry from "../models/gicentry.js";
import Customer from "../models/customer.js";
import Master from "../models/master.model.js";


// --- HELPER: Normalize Date ---
const getCleanDate = (dateInput) => {
    if (!dateInput) return null;
    if (typeof dateInput === 'string' && dateInput.includes("-")) {
        const parts = dateInput.split("-");
        if (parts[0].length === 4) return `${parts[2]}${parts[1]}${parts[0]}`;
        if (parts[0].length === 2) return `${parts[0]}${parts[1]}${parts[2]}`;
    }
    if (String(dateInput).length === 8 && !String(dateInput).includes("-")) return dateInput;
    return null;
};

// --- HELPER: Parse Date Key ---
const parseDateKey = (dStr) => {
    if (!dStr || typeof dStr !== 'string' || dStr.length !== 8) return 0;
    const d = parseInt(dStr.substring(0, 2));
    const m = parseInt(dStr.substring(2, 4));
    const y = parseInt(dStr.substring(4, 8));
    return new Date(y, m - 1, d).getTime();
};

// --- HELPER: Matching Logic ---
const areRulesMatching = (ruleA, ruleB) => {
    const normalize = (val) => {
        let s = String(val || '').trim().toLowerCase();
        s = s.replace(/%/g, ''); 
        return (s === 'all' || s === '0-max') ? '' : s;
    };
    
    const getRange = (rule, type) => {
        const range = rule[`${type}Range`];
        const from = rule[`${type}From`];
        const to = rule[`${type}To`];
        return range || (from && to ? `${from}-${to}` : '');
    }

    return (
        normalize(ruleA.company) === normalize(ruleB.company) &&
        normalize(ruleA.product) === normalize(ruleB.product) &&
        normalize(ruleA.coverage) === normalize(ruleB.coverage) &&
        normalize(ruleA.vehicleModel) === normalize(ruleB.vehicleModel) &&
        !!ruleA.pa === !!ruleB.pa &&
        !!ruleA.withoutAddon === !!ruleB.withoutAddon &&
        normalize(ruleA.fuel) === normalize(ruleB.fuel) &&
        normalize(ruleA.rto) === normalize(ruleB.rto) &&
        normalize(getRange(ruleA, 'cc')) === normalize(getRange(ruleB, 'cc')) &&
        normalize(getRange(ruleA, 'ncb')) === normalize(getRange(ruleB, 'ncb'))
    );
};

// --- HELPER: Merge Items ---
const mergeItemsIntoDoc = (doc, itemsToMerge) => {
    let updatedCount = 0;
    let newCount = 0;
    itemsToMerge.forEach(ruleToApply => {
        const existingRuleIndex = doc.items.findIndex(
            existingRule => (existingRule.dealerName === ruleToApply.dealerName) && areRulesMatching(existingRule, ruleToApply)
        );

        if (existingRuleIndex !== -1) {
            doc.items[existingRuleIndex].percent = ruleToApply.percent;
            doc.items[existingRuleIndex].OnNet = ruleToApply.OnNet;
            doc.items[existingRuleIndex].percentOnNet = ruleToApply.percentOnNet;
            doc.items[existingRuleIndex].fixed = ruleToApply.fixed;
            doc.items[existingRuleIndex].applyToAllPartners = ruleToApply.applyToAllPartners; 
            updatedCount++;
        } else {
            doc.items.push(ruleToApply);
            newCount++;
        }
    });
    return { updatedCount, newCount };
};

/* ==========================================================================
   1. SAVE LOGIC (DEEP SCAN MODE & ONE-TIME APPLY TRIGGER)
   ========================================================================== */
export const savePartnerGICBreakdown = async (req, res) => {
    try {
        const { partnerName, commissionDate, items } = req.body;
        const dateKey = getCleanDate(commissionDate);
        console.log(`Processing Save for: ${partnerName}, Date: ${dateKey}`);

        if (!partnerName || !dateKey || !items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid Data" });
        }

        // 1. Process Items (Sanitize & Keep Checkbox State Temporarily)
        const itemsWithState = items.map(item => ({
            dealerName: item.dealerName || "Unknown",
            dealerPercent: parseFloat(item.dealerPercent) || 0,
            company: item.company,
            product: item.product,
            coverage: item.coverage || '',
            vehicleModel: item.vehicleModel || '',
            OnNet: item.OnNet || item.percentOnNet || false,
            percentOnNet: item.OnNet || item.percentOnNet || false,
            pa: !!item.pa,
            withoutAddon: !!item.withoutAddon,
            fuel: item.fuel || '',
            rto: item.rto || '',
            ccRange: item.ccRange || '',
            ncbRange: item.ncbRange || '',
            fixed: parseFloat(item.fixed) || 0,
            percent: parseFloat(item.percent) || 0,
            // Capture the user's intent here
            applyToAllPartners: !!item.applyToAllPartners 
        }));

        // 2. Identify Triggers (Which rules need to be copied?)
        const rulesToApplyAll = itemsWithState.filter(item => item.applyToAllPartners);

        // 3. Prepare Items for CURRENT PARTNER (Force applyToAllPartners = FALSE)
        const itemsForCurrent = itemsWithState.map(item => ({
            ...item,
            applyToAllPartners: false // Reset flag so it unchecks on next load
        }));

        // 4. SAVE CURRENT PARTNER
        let currentPartnerDoc = await PartnerGICCommission.findOne({ partnerName: partnerName, commissionDate: dateKey });
        if (!currentPartnerDoc) {
            currentPartnerDoc = new PartnerGICCommission({ partnerName: partnerName, commissionDate: dateKey, items: [] });
        }
        
        // Use itemsForCurrent (where flag is false)
        mergeItemsIntoDoc(currentPartnerDoc, itemsForCurrent);
        await currentPartnerDoc.save();
        console.log(`✅ Saved Current Partner (${partnerName}) - Checkboxes Reset`);

        // 5. HANDLE "APPLY TO ALL" (DEEP SCAN)
        if (rulesToApplyAll.length > 0) {
            console.log(`🚀 DEEP SCAN ACTIVATED: Scanning ALL collections for partners...`);

            // --- EFFICIENT PARTNER SEARCH ---
            const allPartners = await Master.find({ type: 'partner', status: 'Active' }).lean();
            const allPartnerNames = allPartners.map(p => p.name);

            const otherPartnerNames = allPartnerNames.filter(pName => 
                pName.trim().toLowerCase() !== partnerName.trim().toLowerCase()
            );

            console.log(`✅ Final Action Count: Updating ${otherPartnerNames.length} other partners.`);
            
            // Prepare rules for OTHERS (Force applyToAllPartners = FALSE)
            const rulesForDb = rulesToApplyAll.map(item => ({ 
                ...item,
                applyToAllPartners: false // Reset flag for others too
            }));

            for (const pName of otherPartnerNames) {
                console.log(`🔄 Updating Partner: ${pName}...`);

                let commissionDoc = await PartnerGICCommission.findOne({ partnerName: pName, commissionDate: dateKey });

                if (!commissionDoc) {
                    commissionDoc = new PartnerGICCommission({
                        partnerName: pName,
                        commissionDate: dateKey,
                        items: []
                    });
                }

                const stats = mergeItemsIntoDoc(commissionDoc, rulesForDb);
                await commissionDoc.save();
                console.log(`   -> Updated ${stats.updatedCount}, Added ${stats.newCount} rules for ${pName}`);
            }
        } else {
            console.log("No rules marked for Apply All.");
        }

        res.json({ success: true, message: "Partner GIC Commission saved successfully (Deep Scan Applied)" });

    } catch (err) {
        console.error("SAVE ERROR:", err);
        res.status(500).json({ success: false, message: "Server error: " + err.message });
    }
};

/* ==========================================================================
   2. GET LOGIC (No Changes)
   ========================================================================== */
export const getPartnerGICBreakdown = async (req, res) => {
    try {
        const { partnerId, partnerName, date } = req.query;
        const pName = partnerName || partnerId;
        if (!date) return res.status(400).json({ success: false, message: "Date is required" });

        const dateKey = getCleanDate(date); 
        const targetDate = new Date(date); 
        targetDate.setHours(23, 59, 59, 999);

        const allRules = await DealerExpense.find({ expenseType: "gic_breakdown", date: { $lte: targetDate } }).sort({ date: -1 }).lean();

        const dealerMap = new Map();
        for (const rule of allRules) {
            const dealerName = rule.dealer; 
            if (dealerName && !dealerMap.has(dealerName)) dealerMap.set(dealerName, rule);
        }
        const uniqueDealerDocs = Array.from(dealerMap.values());

        let savedPartnerRules = [];
        if (pName) {
            let partnerRecord = await PartnerGICCommission.findOne({ partnerName: pName, commissionDate: dateKey }).lean();
            if (!partnerRecord) {
                const allRecords = await PartnerGICCommission.find({ partnerName: pName }).lean();
                const currentTimestamp = parseDateKey(dateKey);
                const validRecords = allRecords.filter(r => parseDateKey(r.commissionDate) <= currentTimestamp);
                if (validRecords.length > 0) {
                    validRecords.sort((a, b) => parseDateKey(b.commissionDate) - parseDateKey(a.commissionDate));
                    partnerRecord = validRecords[0]; 
                }
            }
            if (partnerRecord && partnerRecord.items) savedPartnerRules = partnerRecord.items;
        }

        const mergedData = [];
        for (const dealerDoc of uniqueDealerDocs) {
            const dealerName = dealerDoc.dealer;
            const dealerItems = dealerDoc.breakdownItems || [];

            for (const rule of dealerItems) {
                const savedMatch = savedPartnerRules.find(p => (p.dealerName === dealerName) && areRulesMatching(rule, p));
                mergedData.push({
                    ...rule,
                    dealerName: dealerName,
                    dealerPercent: rule.percent,
                    percent: savedMatch ? savedMatch.percent : 0, 
                    OnNet: savedMatch ? (savedMatch.OnNet || savedMatch.percentOnNet) : (rule.OnNet || rule.percentOnNet),
                    percentOnNet: savedMatch ? (savedMatch.OnNet || savedMatch.percentOnNet) : (rule.OnNet || rule.percentOnNet),
                    applyToAllPartners: savedMatch ? savedMatch.applyToAllPartners : false,
                    date: dealerDoc.date,
                    isSaved: !!savedMatch
                });
            }
        }
        mergedData.sort((a, b) => a.dealerName.localeCompare(b.dealerName));
        return res.json({ success: true, data: mergedData });
    } catch (error) {
        console.error("GET ERROR:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllBreakdownForPartner = getPartnerGICBreakdown;


/* =========================================================
   NEW REPORTING LOGIC
========================================================= */

const normalize = (v) => String(v || "").trim().toLowerCase();

const parseRange = (rangeStr) => {
    const s = normalize(rangeStr).replace(/%/g, "");
    if (!s || s === "all" || s === "") return { min: 0, max: Infinity };
    const parts = s.split("-");
    const min = parseFloat(parts[0]) || 0;
    const max = (!parts[1] || parts[1].includes("max")) ? Infinity : parseFloat(parts[1]);
    return { min, max };
};

const scoreField = (ruleVal, policyVal, weight) => {
    const r = normalize(ruleVal);
    const p = normalize(policyVal);
    if (r === "all" || r === "") return 1;
    if (r === p) return weight;
    return -1;
};

export const getPartnerCommissionReport = async (req, res) => {
    try {
        const { partner, companies, fromDate, toDate, search, dateFilterType } = req.body;

        if (!partner) {
            return res.status(400).json({ success: false, message: "Partner is required." });
        }

        // 1. Find Partner ID
        const partnerDoc = await Master.findOne({ name: partner, type: 'partner' }).lean();
        if (!partnerDoc) {
            return res.status(404).json({ success: false, message: "Partner not found." });
        }

        // 2. Build Query
        let query = { partner: partnerDoc._id };
        if (companies?.length) query.insCompany = { $in: companies };

        const dateField = dateFilterType === 'entryDate' ? 'createdAt' : 'odStartDate';
        if (fromDate && toDate) {
            query[dateField] = { $gte: new Date(fromDate), $lte: new Date(toDate) };
        }

        if (search) {
            const regex = new RegExp(search, "i");
            const customers = await Customer.find({ $or: [{ name: regex }, { mobile: regex }] }).select("_id");
            query.$or = [
                { policyNo: regex },
                { vehicleNo: regex },
                { customer: { $in: customers.map(c => c._id) } }
            ];
        }

        // 3. Fetch Policies
        const policies = await GicEntry.find(query)
            .populate("customer", "name")
            .populate("partner", "name")
            .lean();

        // 4. Fetch Latest Rules for the Partner
        const partnerRulesDoc = await PartnerGICCommission.findOne({ partnerName: partner })
            .sort({ commissionDate: -1 }) // Assuming date string 'ddmmyyyy' sorts correctly as string; might need parsing if not.
            .lean();
        
        const rules = partnerRulesDoc ? partnerRulesDoc.items : [];

        // 5. Process Each Policy
        const reportData = policies.map(policy => {
            let matchedRule = null;
            
            if (rules.length > 0) {
                 const pName = normalize(policy.gicProduct || "");
                 const pFuel = normalize(policy.fuelType || "");
                 const pModel = normalize(policy.vehicleName || "");
                 const pType = normalize(policy.policyType || "");
                 const pRTO = normalize(policy.vehicleNo || "").replace(/[^a-z0-9]/g, "").substring(0, 4);

                const pCC = parseFloat(String(policy.ccKwGvw || "0").replace(/[^0-9.]/g, "")) || 0;
                const pNCB = parseFloat(String(policy.ncb || "0").replace(/[^0-9.]/g, "")) || 0;

                const scoredRules = rules.map(rule => {
                    const rCC = parseRange(rule.ccRange);
                    if (pCC < rCC.min || pCC > rCC.max) return null;

                    const rNCB = parseRange(rule.ncbRange);
                    if (pNCB < rNCB.min || pNCB > rNCB.max) return null;

                    const sCompany = scoreField(rule.company, policy.insCompany, 100);
                    const sProduct = scoreField(rule.product, pName, 500);
                    const sFuel = scoreField(rule.fuel, pFuel, 1000);
                    const sModel = scoreField(rule.vehicleModel, pModel, 200);
                    const sCoverage = scoreField(rule.coverage, pType, 150);

                    let sRTO = 0;
                    const rRTO = normalize(rule.rto).replace(/[^a-z0-9]/g, "");
                    if (rRTO && rRTO !== "all") {
                        if (pRTO.includes(rRTO)) sRTO = 2000;
                        else return null;
                    } else {
                        sRTO = 1;
                    }

                    if ([sCompany, sProduct, sFuel, sModel, sCoverage].some(s => s < 0)) return null;

                    return { rule, totalScore: sCompany + sProduct + sFuel + sModel + sRTO + sCoverage };
                }).filter(Boolean);

                if (scoredRules.length) {
                    scoredRules.sort((a, b) => b.totalScore - a.totalScore);
                    matchedRule = scoredRules[0].rule;
                }
            }

            // 6. Calculate Commission
            const odPremium = parseFloat(policy.odPremium) || 0;
            const netPremium = parseFloat(policy.netPremium) || 0;
            let commPercent = 0, fixed = 0, commAmt = 0, calcOn = "NA";

            if (matchedRule) {
                commPercent = parseFloat(matchedRule.percent) || 0;
                fixed = parseFloat(matchedRule.fixed) || 0;
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
                policyDate: policy.odStartDate,
                entryDate: policy.createdAt,
                partnerName: policy.partner?.name || partner,
                policyNo: policy.policyNo,
                vehicleNo: policy.vehicleNo,
                customerName: policy.customer?.name || "Unknown",
                gicProduct: policy.gicProduct,
                insCompany: policy.insCompany,
                vehicleName: policy.vehicleName,
                fuelType: policy.fuelType,
                premium: policy.premium,
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
        console.error("Partner GIC Report Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};