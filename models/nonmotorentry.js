import mongoose from "mongoose";

const NMSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    customerName: String,
    partner: String,
    product: String,
    policyNo: String,
    endorsementNo: String,
    policyType: String,
    issueDate: Date,
    startDate: Date,
    endDate: Date,
    sumInsured: Number,
    netPremium: Number,
    gst: Number,
    totalPremium: Number,
    dealerName: String,
    insuranceCompany: String,
    previousPolicy: {
        insCo: String,
        policyNo: String,
        expiryDate: Date,
        claimStatus: String
    },
    payment: {
        amount: Number,
        date: Date,
        mode: String,
        chequeNo: String,
        bank: String
    },
    attachments: {
        policy: String,
        proposal: String,
        kyc: String
    },
    createdAt: { type: Date, default: Date.now }
});

// ✅ Is line ko dhyan se check karein, yahi export error solve karega
export default mongoose.models.NonMotorEntry || mongoose.model("NonMotorEntry", NMSchema);