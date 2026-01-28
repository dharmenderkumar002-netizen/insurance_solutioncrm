import mongoose from "mongoose";

const ruleSchema = new mongoose.Schema({
    company: { type: String, required: true },
    product: { type: String, required: true },
    policyType: { type: String, default: 'All' },
    term: { type: String, default: 'All' },
    
    // Compatibility fields
    percentOnNet: { type: Boolean, default: false },
    OnNet: { type: Boolean, default: false }, 
    
    fixed: { type: Number, default: 0 },
    percent: { type: Number, default: 0 },
    saRange: { type: String, default: '0-Max' }
});

const HealthCommissionSchema = new mongoose.Schema({
    dealerName: { type: String, required: true },

    // ✅ Renamed to 'date' (GIC Style)
    date: { 
        type: Date, 
        required: true 
    },

    breakdownItems: [ruleSchema]
}, { timestamps: true });

// ✅ NEW INDEX: Uses 'date' instead of 'Date'
HealthCommissionSchema.index({ dealerName: 1, date: 1 }, { unique: true });

export default mongoose.models.dealerhealthcommission || mongoose.model("dealerhealthcommission", HealthCommissionSchema);