import mongoose from "mongoose";

const gicRuleSchema = new mongoose.Schema({
    // ✅ NEW: Added Dealer Info to track which dealer this rule belongs to
    dealerName: { type: String, required: true }, 
    dealerPercent: { type: Number, default: 0 }, // Reference to max allowed limit

    company: { type: String, required: true },
    product: { type: String, required: true },
    coverage: { type: String, default: 'All' },
    vehicleModel: { type: String, default: 'All' },
    
    OnNet: { type: Boolean, default: false }, 
    // Note: Controller maps 'percentOnNet' to 'OnNet' before saving

    pa: { type: Boolean, default: false },
    withoutAddon: { type: Boolean, default: false },
    
    fuel: { type: String, default: 'All' },
    rto: { type: String, default: 'All' },
    
    ccRange: { type: String, default: '0-Max' },
    ncbRange: { type: String, default: '0-Max' },
    
    fixed: { type: Number, default: 0 },
    percent: { type: Number, default: 0 } // This is the Partner's Commission
});

const PartnerGICCommissionSchema = new mongoose.Schema({
    partnerName: { type: String, required: true },
    commissionDate: { type: String, required: true }, // Format: ddmmyyyy
    items: [gicRuleSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Prevent duplicate entries for the same partner on the same date
PartnerGICCommissionSchema.index({ partnerName: 1, commissionDate: 1 }, { unique: true });

export default mongoose.models.partnergiccommission || mongoose.model("partnergiccommission", PartnerGICCommissionSchema);