// backend/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile: { type: String, required: true },
  password: { type: String }, // hashed password; optional until approved
  role: { type: String, default: "user" },
  approvedBy: { type: String, default: process.env.APPROVER_DEFAULT || "DHARMENDER.KUMAR002@gmail.com" },
  status: { type: String, enum: ["pending", "active", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

const user = mongoose.model("user", userSchema);
export default user;
