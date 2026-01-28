import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/user.js";
import Partner from "./models/partner.js";
import Customer from "./models/customer.js";
import GICEntry from "./models/gicentry.js";

const MONGO = process.env.MONGO || "mongodb://127.0.0.1:27017/insurance_crm";

async function main() {
  await mongoose.connect(MONGO);
  console.log("Connected to seed DB");

  let admin = await User.findOne({ email: "admin@demo.com" });
  if (!admin) {
    admin = new User({
      name: "Admin Demo",
      email: "admin@demo.com",
      mobile: "9999999999",
      role: "admin",
      status: "active",
      password: await bcrypt.hash("Test@1234", 10)
    });
    await admin.save();
    console.log("Created admin@demo.com / Test@1234");
  } else {
    console.log("Admin exists");
  }

  let p = await Partner.findOne({ name: "Sample Partner" });
  if (!p) {
    p = new Partner({ name: "Sample Partner", phone: "9876543210", email: "partner@demo.com", inOut: "In" });
    await p.save();
    console.log("Created Sample Partner");
  }

  let c = await Customer.findOne({ name: "Nishika Singh" });
  if (!c) {
    c = new Customer({ sno: 1, name: "Nishika Singh", address: "Delhi", email: "nishika@demo.com", mobile: "9123456780", partner: p._id });
    await c.save();
    console.log("Created sample customer");
  }

  const existing = await GICEntry.findOne({ policyNo: "GIC-TEST-001" });
  if (!existing) {
    const g = new GICEntry({
      customer: c._id,
      partner: p._id,
      policyNo: "GIC-TEST-001",
      vehicleNo: "DL1AB1234",
      vehicleName: "Honda Activa",
      engineNo: "ENG123456",
      chassisNo: "CHS123456",
      insuranceYear: "2025",
      policyIssueDate: new Date(),
      premium: 5000,
      net: 4800
    });
    await g.save();
    console.log("Created sample GIC entry");
  }

  console.log("Seeding complete");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
