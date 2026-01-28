import mongoose from "mongoose";

const LSchema = new mongoose.Schema({
  // Customer Link
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  customerName: String, // For display if customer is not populated

  // Dealer and Insurance Co
  dealerName: { type: String },
  insCompany: { type: String }, // Renamed from insuranceCompany for consistency

  // Basic Policy Info
  partner: String,
  plans: [String], // For multi-plan selection
  planName: String, // Main plan for logic
  policyNo: String,
  endorsementNo: String,
  payMode: String, // e.g., YLY, HLY
  insuranceYear: String,

  // Dates
  policyIssueDate: { type: Date }, // Added for consistency
  issueDate: Date, // Kept for backward compatibility
  startDate: Date,
  maturityDate: Date,
  premiumPaidDate: Date,
  premiumDueDate: Date,

  // Amounts
  premium: Number,     // Total Premium
  netPremium: Number,
  otherAdjustment: Number,
  sumAssured: Number,

  // Terms
  premiumPayingTerm: String,
  pptInYears: String,

  // Status
  status: { type: String, default: 'Issued' }, // Added for consistency

  // Insured members
  familyMembers: [{ name: String, dob: Date, relation: String }],

  // Previous Policy
  previousPolicy: {
    insCo: String,
    endDate: Date,
    policyNo: String,
    previousPolicyNo: String
  },

  // Standardized Payment Details
  amountReceived: {
    amount: Number,
    date: Date,
    paymentMode: String, // e.g., Cheque, Online
    chequeDd: String, // Cheque/Ref number
    bankName: String
  },

  // Attachments
  attachments: {
    policyDoc: String,
    otherDoc: String,
    pan: String,
    aadhar: String,
    gst: String
  },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.LICEntry || mongoose.model("LICEntry", LSchema);
