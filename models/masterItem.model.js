import mongoose from "mongoose";

const masterSchema = new mongoose.Schema({
  type: { type: String, required: true },       
  s_no: { type: Number, required: true },

  name: { type: String },    

  meta: {
    type: Object,
    default: {}
  },

  status: { type: String, enum: ["Active","Inactive"], default: "Active" },
  date: { type: String }
}, { timestamps: true });

export default mongoose.models.masterItem || mongoose.model("masterItem", masterSchema);
