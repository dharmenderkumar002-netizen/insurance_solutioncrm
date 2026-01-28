import mongoose from "mongoose";

const ExpenseSettingSchema = new mongoose.Schema({
  type: { type: String, required: true }, // gic, lic, health, nonmotor
  dealer: { type: String, required: true },
  status: { type: String, default: "Active" },
  settingDate: { type: Date, default: Date.now },

  rows: [
    {
      sno: Number,
      company: String,
      vehicleProduct: String,
      vehicleClass: String,
      fuelType: String,
      coverage: String,
      payoutType: String, // on OD / on NET
      payoutValue: Number
    }
  ]
});

export default mongoose.models.ExpenseSetting || mongoose.model("ExpenseSetting", ExpenseSettingSchema);
