import mongoose from "mongoose";

const ruleSchema = new mongoose.Schema({
  company: String,
  product: String,
  policyType: String,
  minPremium: Number,
  maxPremium: Number,
  fixedAmount: Number,
  percentage: Number
});

const DealerNonMotorCommissionSchema = new mongoose.Schema({
  dealerName: { type: String, required: true },
  
  // ✅ FIX: Type String se change karke Date kar diya (GIC format)
  // Field ka naam bhi small 'date' rakha hai standard ke liye
  date: { type: Date, required: true }, 

  rules: [ruleSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for faster queries ensures unique entry for Dealer + Date
DealerNonMotorCommissionSchema.index({ dealerName: 1, date: 1 }, { unique: true });

export default mongoose.models.DealerNonMotorCommission || mongoose.model("DealerNonMotorCommission", DealerNonMotorCommissionSchema);