import mongoose from "mongoose";

const DealerExpenseSchema = new mongoose.Schema({
  dealer: { type: String, required: true, index: true }, // Index added for faster search
  expenseType: { type: String, required: true },         // Example: "gic_breakdown"
  amount: { type: Number, default: 0 },
  remarks: String,
  date: { type: Date, default: Date.now, index: true },  // Index added for date range reports

  // Array to store the table rows
  breakdownItems: [
    {
      company: { type: String, default: "" },
      product: { type: String, default: "" },
      coverage: { type: String, default: "All" },
      vehicleModel: { type: String, default: "All" },   // <-- New Field: Model

      // Commission Calculation Flags
      OnNet: { type: Boolean, default: false },         // Backend standard naming
      percentOnNet: { type: Boolean, default: false },  // Frontend naming (kept for safety)
      pa: { type: Boolean, default: false },            // <-- PA Included
      withoutAddon: { type: Boolean, default: false },  // <-- Without Add-on

      // Filters
      fuel: { type: String, default: "All" },
      rto: { type: String, default: "All" },
      ccRange: { type: String, default: "0-Max" },
      ncbRange: { type: String, default: "0-Max" },

      // Payout Values
      fixed: { type: Number, default: 0 },
      percent: { type: Number, default: 0 }
    }
  ]
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

export default mongoose.models.DealerExpense || mongoose.model("DealerExpense", DealerExpenseSchema);