import mongoose from "mongoose";

const MasterSchema = new mongoose.Schema({
  type: { type: String, required: true },   // partner, dealer, vehicle, coverage, etc.
  s_no: { type: Number, required: true },
  name: { type: String, required: true },

  // dynamic extra fields for different master types
  meta: { type: Object, default: {} },

  mobile: String,
  email: String,
  inout: String,

  status: { type: String, default: "Active" },
  date: { type: String }
}, { timestamps: true });

export default mongoose.models.master || mongoose.model("master", MasterSchema);
