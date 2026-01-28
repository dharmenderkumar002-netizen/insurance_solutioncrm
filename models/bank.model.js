import mongoose from "mongoose";

const bankSchema = new mongoose.Schema(
  {
    s_no: { type: Number, required: true },
    bank_name: { type: String, required: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    date: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: "banks", // 🔥 FORCE correct collection
  }
);

const db = mongoose.connection.useDb("insurancecrm");
export default db.models.Bank || db.model("Bank", bankSchema);
