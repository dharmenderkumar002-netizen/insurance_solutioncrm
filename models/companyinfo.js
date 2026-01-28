import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema({
  name: String,
  address: String,
  email: String,
  phone: String,
  gstin: String,
  logoPath: String,
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.companyinfo || mongoose.model("companyinfo", CompanySchema);
