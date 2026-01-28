import mongoose from "mongoose";

const GICSchema = new mongoose.Schema({
  // Relations
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  partner: { type: mongoose.Schema.Types.ObjectId, ref: "Master" },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Master" }, 
  
  // Basic Details
  policyNo: { type: String, trim: true, uppercase: true }, // Auto-Capital
  customerName: { type: String, trim: true, uppercase: true }, // Auto-Capital
  dealerName: { type: String, trim: true, uppercase: true },   // Auto-Capital
  insCompany: { type: String, trim: true, uppercase: true },   // Auto-Capital
  gicProduct: { type: String, trim: true, uppercase: true },   // Auto-Capital (Gcv, Car etc)
  
  coverageType: { type: String, uppercase: true },
  fuel: { type: String, uppercase: true }, // Petrol, Diesel etc in Capital
  policyType: { type: String, uppercase: true },
  idv: Number,
  vehicleNo: { type: String, trim: true, uppercase: true },
  vehicleName: { type: String, uppercase: true },
  vehicleRegDate: { type: Date },
  vehicleModel: { type: String, uppercase: true }, 
  insuranceYear: { type: String, required: true },
  
  // Dates
  policyDate: { type: Date, default: Date.now },
  policyIssueDate: Date,
  odStartDate: Date,
  odEndDate: Date,
  tpStartDate: Date,
  tpEndDate: Date,
  
  // Finance
  premium: Number,
  netPremium: Number,
  odPremium: Number,
  discount: Number,
  
  // Details
  engineNo: { type: String, trim: true, uppercase: true },
  chassisNo: { type: String, trim: true, uppercase: true },
  vehicleClass: { type: String, uppercase: true },
  ccKwGvw: String,
  ncb: Number,
  
  // Conditional Fields
  pa: Number,
  paToPass: Number,
  paTaxi: Number,
  trailorType: { type: String, uppercase: true },
  
  // Bank/Payment
  amountReceived: {
    amount: Number,
    date: Date,
    paymentMode: { type: String, uppercase: true },
    chequeDd: { type: String, uppercase: true },
    bankName: { type: String, uppercase: true }
  },
  
  // Previous Policy
  previousPolicy: {
    insCo: { type: String, uppercase: true },
    endDate: Date,
    previousPolicyNo: { type: String, uppercase: true }
  },
  
  createdAt: { type: Date, default: Date.now }
});

/* =========================================================
   MIDDLEWARE: Save hone se pehle sab kuch Capital karne ke liye
========================================================= */
GICSchema.pre('save', function (next) {
    const doc = this;
    
    // Schema ki sabhi fields ko check karke string ko uppercase karna
    const fields = Object.keys(doc._doc);
    fields.forEach(field => {
        if (typeof doc[field] === 'string' && field !== '_id') {
            doc[field] = doc[field].toUpperCase().trim();
        }
    });

    // Nested Objects ke liye manual check (Bank & Previous Policy)
    if (doc.amountReceived) {
        if (doc.amountReceived.paymentMode) doc.amountReceived.paymentMode = doc.amountReceived.paymentMode.toUpperCase();
        if (doc.amountReceived.bankName) doc.amountReceived.bankName = doc.amountReceived.bankName.toUpperCase();
    }
    
    if (doc.previousPolicy) {
        if (doc.previousPolicy.insCo) doc.previousPolicy.insCo = doc.previousPolicy.insCo.toUpperCase();
    }

    next();
});

// Text Index
GICSchema.index({ policyNo: "text", vehicleNo: "text", engineNo: "text", chassisNo: "text" });

export default mongoose.models.GICEntry || mongoose.model("GICEntry", GICSchema);