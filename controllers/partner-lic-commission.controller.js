import PartnerLICCommission from "../models/partnerliccommission.js";
import DealerLICCommission from "../models/dealerliccommission.js"; 
import mongoose from "mongoose";

// --- HELPER: Normalize Date & Keys ---
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

const generateLicKey = (item) => {
    const dealer = normalize(item.dealerName);
    const company = normalize(item.insuranceCompany);
    const plan = normalize(item.planName);
    let term = normalize(item.termPpt);
    if(term === '-' || term === '0') term = '';
    return `${dealer}|${company}|${plan}|${term}`;
};

/* ==========================================================================
   1. SAVE LOGIC (With "Apply to All" Deep Scan)
   ========================================================================== */
export const savePartnerLICBreakdown = async (req, res) => {
    try {
        const { partnerName, commissionDate, items } = req.body;
        const dateKey = getCleanDate(commissionDate);
        
        if (!partnerName || !dateKey || !items) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const rulesToApplyAll = items.filter(item => item.applyToAllPartners === true);
        const itemsForCurrent = items.map(item => ({ ...item, applyToAllPartners: false }));

        await PartnerLICCommission.findOneAndUpdate(
            { partnerName: partnerName, commissionDate: dateKey },
            { $set: { items: itemsForCurrent, updatedAt: new Date() } },
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
                } catch (e) { /* ignore */ }
            }

            const otherPartners = Array.from(allPartnersMap.values()).filter(p => normalize(p) !== normalize(partnerName));
            const rulesForOthers = rulesToApplyAll.map(r => ({ ...r, applyToAllPartners: false }));

            for (const pName of otherPartners) {
                let partnerDoc = await PartnerLICCommission.findOne({ partnerName: pName, commissionDate: dateKey });
                if (!partnerDoc) {
                    partnerDoc = new PartnerLICCommission({ partnerName: pName, commissionDate: dateKey, items: [] });
                }

                rulesForOthers.forEach(ruleToApply => {
                    const keyToMatch = generateLicKey(ruleToApply);
                    const existingIndex = partnerDoc.items.findIndex(existing => generateLicKey(existing) === keyToMatch);

                    if (existingIndex > -1) {
                        partnerDoc.items[existingIndex].percent = ruleToApply.percent;
                        partnerDoc.items[existingIndex].fixed = ruleToApply.fixed;
                    } else {
                        partnerDoc.items.push(ruleToApply);
                    }
                });
                await partnerDoc.save();
            }
        }

        res.json({ success: true, message: "LIC Data Saved Successfully" });
    } catch (err) {
        console.error("LIC SAVE ERROR:", err);
        res.status(500).json({ success: false, message: "Server error: " + err.message });
    }
};

/* ==========================================================================
   2. GET LOGIC (FIXED: With Fallback for Latest Date)
   ========================================================================== */
export const getPartnerLICBreakdown = async (req, res) => {
    try {
        const { partnerName, date } = req.query;
        if (!partnerName || !date) return res.json({ success: true, data: [] });

        const dateKey = getCleanDate(date); 
        
        const distinctDealers = await DealerLICCommission.distinct("dealerName");
        let allMasterRules = [];

        for (const dealerName of distinctDealers) {
             const dealerDoc = await DealerLICCommission.findOne({ dealerName }).sort({ date: -1 }).lean();
             if (dealerDoc && dealerDoc.items) {
                 dealerDoc.items.forEach(rule => allMasterRules.push({ ...rule, dealerName, dealerPercent: rule.percent, dealerEntryDate: dealerDoc.date }));
             }
        }

        // --- START: MODIFIED GET LOGIC ---
        let partnerDoc = await PartnerLICCommission.findOne({ partnerName, commissionDate: dateKey }).lean();
        
        if (!partnerDoc) {
            const allRecords = await PartnerLICCommission.find({ partnerName }).lean();
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
                const key = generateLicKey(item);
                if(!savedItemsMap.has(key)) {
                    savedItemsMap.set(key, item);
                }
            });
        }

        const finalData = allMasterRules.map(masterRule => {
            const key = generateLicKey(masterRule);
            const savedItem = savedItemsMap.get(key);
            return {
                ...masterRule,
                percent: savedItem ? savedItem.percent : 0, 
                fixed: savedItem ? savedItem.fixed : (masterRule.fixed || 0),
                applyToAllPartners: savedItem ? savedItem.applyToAllPartners : false,
            };
        });

        res.json({ success: true, data: finalData });
    } catch (err) {
        console.error("LIC GET ERROR:", err);
        res.status(500).json({ success: false, message: "Error fetching data" });
    }
};