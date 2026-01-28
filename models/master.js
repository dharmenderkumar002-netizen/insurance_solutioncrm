import mongoose from "mongoose";

const MasterSchema = new mongoose.Schema({
  type: { type: String, required: true },   // partner, dealer, vehicle, coverage, etc.
  name: { type: String, required: true },
  phone: String,
  email: String,
  inOut: String,
  status: { type: String, default: "Active" },
  date: { type: Date, default: Date.now }
});

export default mongoose.models.master || mongoose.model("master", MasterSchema);
