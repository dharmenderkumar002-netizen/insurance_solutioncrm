import mongoose from "mongoose";

// ✅ Updated Schema with insuranceCompany field
const licRuleSchema = new mongoose.Schema({
    insuranceCompany: { type: String, default: '' }, // New Field Added
    planName: String,
    termPpt: String,
    fixed: { type: Number, default: 0 },
    percent: { type: Number, default: 0 }
});

const DealerLICCommissionSchema = new mongoose.Schema({
    dealerName: { type: String, required: true },
    commissionDate: { type: String, required: true }, // ddmmyyyy format
    items: [licRuleSchema],
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.DealerLICCommission || mongoose.model("DealerLICCommission", DealerLICCommissionSchema);