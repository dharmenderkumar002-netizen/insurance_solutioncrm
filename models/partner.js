import mongoose from "mongoose";

const PartnerSchema = new mongoose.Schema({
  // ✅ FIX: 'name' field add kiya jo DB mein actual mein hai
  name: { type: String }, 

  // Legacy support ke liye 'partnername' bhi rakha hai
  partnername: { type: String },

  mobile: String,
  email: String,
  inOut: { type: String, enum: ["In", "Out"], default: "In" },
  status: { type: String, enum: ["Active", "NonActive"], default: "Active" },
  createdAt: { type: Date, default: Date.now }
}, { 
  strict: false, // ✅ IMP: Ye ensure karega ki DB ke hidden fields bhi fetch hon
  collection: 'partner' // ✅ IMP: Agar aapka collection singular 'partner' hai to ye zaroori hai
});

export default mongoose.models.partner || mongoose.model("partner", PartnerSchema);