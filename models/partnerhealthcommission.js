import mongoose from "mongoose";

const healthRuleSchema = new mongoose.Schema({
    // --- CRITICAL FIX: Dealer Name is required for matching ---
    dealerName: { type: String, required: true, default: "Unknown" }, 
    
    company: { type: String, required: true },
    product: { type: String, required: true },
    policyType: { type: String, default: 'All' },
    term: { type: String, default: 'All' },
    
    // --- Matching & Logic Fields ---
    OnNet: { type: Boolean, default: false }, 
    percentOnNet: { type: Boolean, default: false }, // Added for consistency
    fixed: { type: Number, default: 0 },
    
    // --- Commission Values ---
    percent: { type: Number, default: 0 }, // Partner's Saved %
    dealerPercent: { type: Number, default: 0 }, // Dealer Max % (Reference)
    
    saRange: { type: String, default: '0-Max' },
    
    // --- UI State ---
    applyToAllPartners: { type: Boolean, default: false } 
});

const PartnerHealthCommissionSchema = new mongoose.Schema({
    partnerName: { type: String, required: true },
    commissionDate: { type: String, required: true }, // Format: ddmmyyyy
    items: [healthRuleSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Ensure unique commission per partner per date
PartnerHealthCommissionSchema.index({ partnerName: 1, commissionDate: 1 }, { unique: true });

export default mongoose.models.partnerhealthcommission || mongoose.model("partnerhealthcommission", PartnerHealthCommissionSchema);