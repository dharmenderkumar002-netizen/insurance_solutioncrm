import mongoose from "mongoose";

const gicRuleSchema = new mongoose.Schema({
    company: { type: String, required: true },
    product: { type: String, required: true },
    coverage: { type: String, default: 'All' },
    vehicleModel: { type: String, default: 'All' },
    OnNet: { type: Boolean, default: false }, // Represents percentOnNet
    pa: { type: Boolean, default: false },
    withoutAddon: { type: Boolean, default: false },
    fuel: { type: String, default: 'All' },
    rto: { type: String, default: 'All' },
    ccRange: { type: String, default: '0-Max' },
    ncbRange: { type: String, default: '0-Max' },
    fixed: { type: Number, default: 0 },
    percent: { type: Number, default: 0 } // This will store the dealer's commission percentage
});

const DealerGICCommissionSchema = new mongoose.Schema({
    dealerName: { type: String, required: true },
    commissionDate: { type: String, required: true }, // ddmmyyyy format for consistency
    items: [gicRuleSchema],
    createdAt: { type: Date, default: Date.now }
});

DealerGICCommissionSchema.index({ dealerName: 1, commissionDate: 1 }, { unique: true });

export default mongoose.models.DealerGICCommission || mongoose.model("DealerGICCommission", DealerGICCommissionSchema);
