import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  sno: { type: Number, unique: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  mobile: { type: String, required: true, trim: true },
  address: { type: String, default: "N/A" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Customer || mongoose.model("Customer", customerSchema);
