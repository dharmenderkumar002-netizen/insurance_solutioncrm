import mongoose from "mongoose";

const licRuleSchema = new mongoose.Schema({
    // --- CRITICAL FIELDS FOR MATCHING ---
    dealerName: { type: String, required: true, default: "Unknown" }, 

    insuranceCompany: { type: String, default: '' }, 
    planName: { type: String, default: '' },
    termPpt: { type: String, default: '' },

    // --- COMMISSION VALUES ---
    fixed: { type: Number, default: 0 },
    percent: { type: Number, default: 0 },       // Partner Saved %
    dealerPercent: { type: Number, default: 0 }, // Dealer Max % (Reference)

    // --- UI FLAGS ---
    applyToAllPartners: { type: Boolean, default: false } 
});

const PartnerLICCommissionSchema = new mongoose.Schema({
    partnerName: { type: String, required: true },
    commissionDate: { type: String, required: true }, // ddmmyyyy format
    items: [licRuleSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Ensure one entry per partner per date
PartnerLICCommissionSchema.index({ partnerName: 1, commissionDate: 1 }, { unique: true });

export default mongoose.models.partnerliccommission || mongoose.model("partnerliccommission", PartnerLICCommissionSchema);