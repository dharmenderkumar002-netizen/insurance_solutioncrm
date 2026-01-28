import mongoose from "mongoose";

const nonmotorRuleSchema = new mongoose.Schema({
    // --- CRITICAL FIELDS FOR MATCHING ---
    dealerName: { type: String, required: true, default: "Unknown" }, 

    company: { type: String, required: true },
    product: { type: String, required: true },
    policyType: { type: String, default: 'All' },

    // --- PREMIUM RANGES ---
    minPremium: { type: Number, default: 0 },
    maxPremium: { type: Number, default: 99999999 }, // High default for max

    // --- COMMISSION VALUES ---
    fixedAmount: { type: Number, default: 0 },
    percent: { type: Number, default: 0 },       // Partner Saved %
    dealerPercent: { type: Number, default: 0 }, // Dealer Max % (Reference)

    // --- FLAGS ---
    OnNet: { type: Boolean, default: false },    // Added for calculation consistency
    applyToAllPartners: { type: Boolean, default: false } 
});

const PartnerNonMotorCommissionSchema = new mongoose.Schema({
    partnerName: { type: String, required: true },
    commissionDate: { type: String, required: true }, // ddmmyyyy format
    items: [nonmotorRuleSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Ensure one entry per partner per date
PartnerNonMotorCommissionSchema.index({ partnerName: 1, commissionDate: 1 }, { unique: true });

export default mongoose.models.PartnerNonMotorCommission || mongoose.model("PartnerNonMotorCommission", PartnerNonMotorCommissionSchema);