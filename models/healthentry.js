import mongoose from "mongoose";

const HealthSchema = new mongoose.Schema({
  // Customer Link
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },

  // Basic Policy Info
  dealerName: { type: String },
  insCompany: { type: String },
  product: String,
  policyNo: String,
  endorsementNo: String,
  policyType: String,     // Fresh / Renewal / Portability
  productType: String,
  insuranceYear: String,

  // ✅ DATES: Ye ab 12:00 PM wala time accept karenge taaki date change na ho
  policyIssueDate: { type: Date }, // Frontend 'policyIssueDate' bhejta hai
  startDate: { type: Date },
  endDate: { type: Date },

  // Amounts
  sumAssured: Number,
  premium: Number,        // Total Premium
  netPremium: Number,     // Frontend 'netPremium' bhejta hai
  net: Number,            // (Legacy support ke liye rakha hai)

  // Extra Info
  partner: { type: String },
  tpa: { type: String },
  status: { type: String, default: 'Issued' },

  // ✅ Family Members (DOB Fixed)
  familyMembers: [{
    name: String,
    dob: Date,
    relation: String
  }],

  // ✅ Previous Policy (Flat Fields - Frontend ke liye)
  previousPolicyNo: String,
  pypInsCo: String,
  pypEndDate: Date,

  // (Legacy Previous Policy Object - Do not remove)
  previousPolicy: {
    insCo: String,
    endDate: Date,
    previousPolicyNo: String
  },

  // Payment Details
  amountReceived: {
    amount: Number,
    date: Date,
    paymentMode: String,
    chequeDd: String,
    bankName: String
  },

  // Attachments
  attachments: {
    pan: String,
    aadhar: String,
    gst: String
  },

  // (Legacy issueDate field)
  issueDate: Date, 

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.healthentry || mongoose.model("healthentry", HealthSchema);