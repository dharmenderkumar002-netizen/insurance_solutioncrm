import PartnerNonMotorCommission from "../models/partnernonmotorcommission.js";
import DealerNonMotorCommission from "../models/dealernonmotorcommission.js"; 
import mongoose from "mongoose";

// --- HELPER: Normalize & Parse ---
const getCleanDate = (dateInput) => {
    if (!dateInput) return null;
    let y, m, d;
    if (typeof dateInput === 'string' && dateInput.includes('-')) {
        [y, m, d] = dateInput.split('T')[0].split('-');
    } else { return String(dateInput).replace(/[^0-9]/g, ''); }
    return `${d}${m}${y}`;
};

const parseDateKey = (dStr) => {
    if (!dStr || typeof dStr !== 'string' || dStr.length !== 8) return 0;
    const d = parseInt(dStr.substring(0, 2));
    const m = parseInt(dStr.substring(2, 4));
    const y = parseInt(dStr.substring(4, 8));
    return new Date(y, m - 1, d).getTime();
};

const normalize = (str) => String(str || "").trim().toLowerCase();

const generateMatchKey = (item) => {
    const dealer = normalize(item.dealerName);
    const company = normalize(item.company);
    const product = normalize(item.product);
    const policy = normalize(item.policyType);
    let rangeKey = "all";
    if (item.netPremiumRange && normalize(item.netPremiumRange) !== 'all') {
        rangeKey = normalize(item.netPremiumRange);
    } else {
        const min = parseFloat(item.minPremium) || 0;
        const max = parseFloat(item.maxPremium) || 999999999;
        if (min === 0 && max > 90000000) rangeKey = "all";
        else rangeKey = `${min}-${max}`;
    }
    return `${dealer}|${company}|${product}|${policy}|${rangeKey}`;
};

/* ==========================================================================
   1. SAVE LOGIC (With "Apply to All" Deep Scan)
   ========================================================================== */
export const savePartnerNonMotorBreakdown = async (req, res) => {
    try {
        const { partnerName, commissionDate, items } = req.body;
        const dateKey = getCleanDate(commissionDate);
        
        if (!partnerName || !dateKey || !items) {
            return res.status(400).json({ success: false, message: "Required fields missing" });
        }

        const rulesToApplyAll = items.filter(item => item.applyToAllPartners === true);
        const cleanItems = items.map(item => ({
            ...item,
            percent: parseFloat(item.percent || item.partnerPercent) || 0,
            applyToAllPartners: false 
        }));

        await PartnerNonMotorCommission.findOneAndUpdate(
            { partnerName: partnerName, commissionDate: dateKey },
            { $set: { items: cleanItems, updatedAt: new Date() } },
            { upsert: true, new: true }
        );

        if (rulesToApplyAll.length > 0) {
            let allPartnersMap = new Map();
            const collections = await mongoose.connection.db.listCollections().toArray();

            for (const col of collections) {
                if (col.name.includes('system.')) continue;
                try {
                    const docs = await mongoose.connection.collection(col.name).find({ 'type': 'partner' }).toArray();
                    docs.forEach(doc => {
                        if (doc.name && !allPartnersMap.has(normalize(doc.name))) {
                            allPartnersMap.set(normalize(doc.name), doc.name.trim());
                        }
                    });
                } catch (e) { /* Ignore collections without 'type' or other errors */ }
            }

            const otherPartners = Array.from(allPartnersMap.values()).filter(p => normalize(p) !== normalize(partnerName));
            
            for (const pName of otherPartners) {
                let partnerDoc = await PartnerNonMotorCommission.findOne({ partnerName: pName, commissionDate: dateKey });

                if (!partnerDoc) {
                    partnerDoc = new PartnerNonMotorCommission({ partnerName: pName, commissionDate: dateKey, items: [] });
                }
                
                rulesToApplyAll.forEach(ruleToApply => {
                    const keyToMatch = generateMatchKey(ruleToApply);
                    const existingIndex = partnerDoc.items.findIndex(existing => generateMatchKey(existing) === keyToMatch);

                    const newRule = { ...ruleToApply, percent: ruleToApply.percent || ruleToApply.partnerPercent || 0, applyToAllPartners: false };

                    if (existingIndex > -1) {
                        partnerDoc.items[existingIndex].percent = newRule.percent;
                    } else {
                        partnerDoc.items.push(newRule);
                    }
                });

                await partnerDoc.save();
            }
        }

        res.json({ success: true, message: "Data Saved Successfully" });

    } catch (err) {
        console.error("NON-MOTOR SAVE ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ==========================================================================
   2. GET LOGIC (FIXED: With Fallback for Latest Date)
   ========================================================================== */
export const getPartnerNonMotorBreakdown = async (req, res) => {
    try {
        const { partnerName, date } = req.query;
        if (!partnerName || !date) return res.json({ success: true, data: [] });

        const dateKey = getCleanDate(date); 
        
        const distinctDealers = await DealerNonMotorCommission.distinct("dealerName");
        let allMasterRules = [];

        for (const dealerName of distinctDealers) {
             const dealerDoc = await DealerNonMotorCommission.findOne({ dealerName }).sort({ date: -1 }).lean();
             if (dealerDoc && dealerDoc.rules) {
                 dealerDoc.rules.forEach(rule => allMasterRules.push({ ...rule, dealerName, dealerPercent: rule.percentage, dealerEntryDate: dealerDoc.date }));
             }
        }
        
        // --- START: MODIFIED GET LOGIC ---
        let partnerDoc = await PartnerNonMotorCommission.findOne({ partnerName, commissionDate: dateKey }).lean();
        
        if (!partnerDoc) {
            const allRecords = await PartnerNonMotorCommission.find({ partnerName }).lean();
            const currentTimestamp = parseDateKey(dateKey);
            const validRecords = allRecords.filter(r => parseDateKey(r.commissionDate) <= currentTimestamp);
            
            if (validRecords.length > 0) {
                validRecords.sort((a, b) => parseDateKey(b.commissionDate) - parseDateKey(a.commissionDate));
                partnerDoc = validRecords[0];
            }
        }
        // --- END: MODIFIED GET LOGIC ---

        const savedItemsMap = new Map();
        if (partnerDoc && partnerDoc.items) {
            partnerDoc.items.forEach(item => {
                const key = generateMatchKey(item);
                if (!savedItemsMap.has(key)) {
                    savedItemsMap.set(key, item);
                }
            });
        }

        const finalData = allMasterRules.map(masterRule => {
            const key = generateMatchKey(masterRule);
            const savedItem = savedItemsMap.get(key);

            return {
                ...masterRule,
                percent: savedItem ? savedItem.percent : 0, 
                applyToAllPartners: savedItem ? savedItem.applyToAllPartners : false, 
            };
        });
        
        res.json({ success: true, data: finalData });

    } catch (err) {
        console.error("NON-MOTOR GET ERROR:", err);
        res.status(500).json({ success: false, message: "Error fetching data" });
    }
};