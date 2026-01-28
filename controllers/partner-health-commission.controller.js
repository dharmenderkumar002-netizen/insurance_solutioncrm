import PartnerHealthCommission from "../models/partnerhealthcommission.js";
import DealerHealthCommission from "../models/dealerhealthcommission.js";
import Partner from "../models/partner.js"; 
import Master from "../models/master.model.js";
import mongoose from "mongoose";

// --- HELPER: Date Cleaner (YYYY-MM-DD -> ddmmyyyy) ---
const getCleanDate = (dateInput) => {
    if (!dateInput) return null;
    const str = String(dateInput).trim();
    if (str.includes("-") && str.split("-")[0].length === 4) {
        const [y, m, d] = str.split("-");
        return `${d}${m}${y}`;
    }
    if (str.includes("-") && str.split("-")[0].length === 2) {
        const [d, m, y] = str.split("-");
        return `${d}${m}${y}`;
    }
    if (str.length === 8 && !str.includes("-")) return str;
    return null;
};

// --- HELPER: Date Key to Timestamp ---
const parseDateKey = (dStr) => {
    if (!dStr || dStr.length !== 8) return 0;
    const d = parseInt(dStr.substring(0, 2));
    const m = parseInt(dStr.substring(2, 4));
    const y = parseInt(dStr.substring(4, 8));
    return new Date(y, m - 1, d).getTime();
};

// --- HELPER: Strict Normalization Helper ---
const n = (val) => {
    let s = String(val || "").trim().toLowerCase();
    if (s === "0-max") return "all"; 
    if (s === "") return "all";      
    if (s === "null") return "all";  
    return s;
};

// --- HELPER: Matching Logic ---
const areRulesMatchingHealth = (ruleA, ruleB) => {
    const companyMatch = n(ruleA.company) === n(ruleB.company);
    const productMatch = n(ruleA.product) === n(ruleB.product);
    const policyMatch = n(ruleA.policyType) === n(ruleB.policyType);
    const termMatch = n(ruleA.term) === n(ruleB.term);
    const saMatch = n(ruleA.saRange) === n(ruleB.saRange); 

    return companyMatch && productMatch && policyMatch && termMatch && saMatch;
};

// --- HELPER: Merge Logic ---
const mergeItemsIntoDoc = (doc, itemsToMerge) => {
    let updatedCount = 0;
    let newCount = 0;

    itemsToMerge.forEach(newItem => {
        const existingIndex = doc.items.findIndex(existing => 
            n(existing.dealerName) === n(newItem.dealerName) && 
            areRulesMatchingHealth(existing, newItem)
        );

        if (existingIndex !== -1) {
            doc.items[existingIndex].percent = newItem.percent;
            doc.items[existingIndex].OnNet = newItem.OnNet;
            doc.items[existingIndex].percentOnNet = newItem.percentOnNet;
            doc.items[existingIndex].applyToAllPartners = newItem.applyToAllPartners;
            updatedCount++;
        } else {
            doc.items.push(newItem);
            newCount++;
        }
    });
    return { updatedCount, newCount };
};

/* ==========================================================================
   1. GET HEALTH BREAKDOWN
   ========================================================================== */
export const getPartnerHealthBreakdown = async (req, res) => {
    try {
        const { partnerName, date } = req.query;
        if (!partnerName || !date) return res.status(400).json({ success: false, message: "Missing params" });

        const dateKey = getCleanDate(date);
        
        // 1. Get Dealer Rules
        const targetDate = new Date(date);
        targetDate.setHours(23, 59, 59, 999);
        
        const allDealerDocs = await DealerHealthCommission.find({ 
            date: { $lte: targetDate } 
        }).sort({ date: -1 }).lean();

        // Get Unique Latest Rules per Dealer
        const dealerDocsMap = new Map();
        for(const doc of allDealerDocs) {
            const dName = doc.dealerName || doc.dealer;
            if(dName && !dealerDocsMap.has(dName)) {
                dealerDocsMap.set(dName, doc);
            }
        }

        const uniqueDealerRules = [];
        for (const dealerDoc of dealerDocsMap.values()) {
            const dealerName = dealerDoc.dealerName || dealerDoc.dealer;
            if(dealerDoc.breakdownItems && Array.isArray(dealerDoc.breakdownItems)) {
                dealerDoc.breakdownItems.forEach(item => {
                    uniqueDealerRules.push({
                        ...item,
                        dealerName: dealerName,
                        dealerRuleDate: dealerDoc.date,
                        dealerPercent: item.percent || item.maxPercent || 0,
                        
                        // Force Defaults so matching works perfectly
                        policyType: item.policyType || "All",
                        term: item.term || "All",
                        saRange: item.saRange || "0-Max" 
                    });
                });
            }
        }

        // 2. Get Partner Saved Data
        let savedItems = [];
        const exactMatch = await PartnerHealthCommission.findOne({ partnerName, commissionDate: dateKey }).lean();
        
        if (exactMatch) {
            savedItems = exactMatch.items || [];
        } else {
            const allHistory = await PartnerHealthCommission.find({ partnerName }).lean();
            const targetTs = parseDateKey(dateKey);
            const previousRecords = allHistory
                .filter(r => parseDateKey(r.commissionDate) <= targetTs)
                .sort((a, b) => parseDateKey(b.commissionDate) - parseDateKey(a.commissionDate));
            
            if (previousRecords.length > 0) {
                savedItems = previousRecords[0].items || [];
            }
        }

        // 3. Match Logic
        const finalData = uniqueDealerRules.map(dealerRule => {
            const savedRule = savedItems.find(s => 
                n(s.dealerName) === n(dealerRule.dealerName) && 
                areRulesMatchingHealth(s, dealerRule)
            );

            return {
                ...dealerRule,
                percent: savedRule ? savedRule.percent : 0,
                OnNet: savedRule ? (savedRule.OnNet || savedRule.percentOnNet) : (dealerRule.OnNet || dealerRule.percentOnNet),
                percentOnNet: savedRule ? (savedRule.OnNet || savedRule.percentOnNet) : (dealerRule.OnNet || dealerRule.percentOnNet),
                applyToAllPartners: savedRule ? savedRule.applyToAllPartners : false
            };
        });

        // 4. Sort
        finalData.sort((a, b) => {
            const dName = n(a.dealerName).localeCompare(n(b.dealerName));
            if(dName !== 0) return dName;
            const cName = n(a.company).localeCompare(n(b.company));
            if(cName !== 0) return cName;
            return n(a.product).localeCompare(n(b.product));
        });

        res.json({ success: true, data: finalData });

    } catch (err) {
        console.error("GET HEALTH ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ==========================================================================
   2. SAVE HEALTH BREAKDOWN (DEEP SCAN & ONE-TIME TRIGGER)
   ========================================================================== */
export const savePartnerHealthBreakdown = async (req, res) => {
    try {
        const { partnerName, commissionDate, items } = req.body;
        const dateKey = getCleanDate(commissionDate);

        if (!partnerName || !dateKey || !items) return res.status(400).json({ success: false, message: "Invalid Data" });

        // 1. Process Items (Sanitize & Keep Checkbox State Temporarily)
        const itemsWithState = items.map(i => ({
            ...i,
            dealerName: i.dealerName || "Unknown",
            percent: parseFloat(i.percent) || 0,
            dealerPercent: parseFloat(i.dealerPercent) || 0,
            OnNet: i.OnNet || i.percentOnNet || false,
            percentOnNet: i.OnNet || i.percentOnNet || false,
            // Capture intent
            applyToAllPartners: !!i.applyToAllPartners,
            
            // Explicit Defaults
            policyType: i.policyType || "All",
            term: i.term || "All",
            saRange: i.saRange || "0-Max"
        }));

        // 2. Identify Triggers (Which rules need to be copied?)
        const rulesToApplyAll = itemsWithState.filter(item => item.applyToAllPartners);

        // 3. Prepare Items for CURRENT PARTNER (Force applyToAllPartners = FALSE)
        const itemsForCurrent = itemsWithState.map(item => ({
            ...item,
            applyToAllPartners: false // Reset flag so it unchecks on next load
        }));

        // 4. SAVE CURRENT PARTNER
        let currentPartnerDoc = await PartnerHealthCommission.findOne({ partnerName, commissionDate: dateKey });
        if (!currentPartnerDoc) {
            currentPartnerDoc = new PartnerHealthCommission({ partnerName, commissionDate: dateKey, items: [] });
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

                let commissionDoc = await PartnerHealthCommission.findOne({ partnerName: pName, commissionDate: dateKey });

                if (!commissionDoc) {
                    commissionDoc = new PartnerHealthCommission({
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

        res.json({ success: true, message: "Saved Successfully (Deep Scan Applied, Checkboxes Reset)" });

    } catch (err) {
        console.error("SAVE HEALTH ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};