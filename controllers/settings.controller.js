import User from "../models/user.js";
import Company from "../models/companyinfo.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

// =========================
// SMTP CONFIG
// =========================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// =========================
// REGISTER USER (pending approval)
// =========================
export const registerUser = async (req, res) => {
  try {
    const { name, email, mobile } = req.body;

    if (!name || !email)
      return res.status(400).json({ error: "Name & email required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already exists" });

    const approver = process.env.APPROVER_EMAIL;

    const user = await User.create({
      name,
      email,
      mobile,
      status: "Pending",
      approvedBy: approver
    });

    const approveLink =
      `${process.env.APP_URL}/api/settings/approve/${user._id}`;

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: approver,
      subject: "New CRM User Approval Needed",
      html: `
        <p>New User Registered:</p>
        <p>Name: <b>${name}</b></p>
        <p>Email: <b>${email}</b></p>
        <a href="${approveLink}">Click here to APPROVE</a>
      `
    });

    res.json({ success: true, message: "User registered (Pending)" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =========================
// APPROVE USER
// =========================
export const approveUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.status === "Active")
      return res.json({ success: true, message: "User already active" });

    const pass = Math.random().toString(36).slice(-8) + "A1!";
    const hash = await bcrypt.hash(pass, 10);

    user.passwordHash = hash;
    user.status = "Active";
    user.approvedAt = new Date();
    await user.save();

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: user.email,
      subject: "CRM Account Activated",
      html: `
        <p>Your CRM account has been approved.</p>
        <p>Email: <b>${user.email}</b></p>
        <p>Password: <b>${pass}</b></p>
        <p>Please login and change password.</p>
      `
    });

    res.json({ success: true, message: "User Approved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =========================
// LIST USERS
// =========================
export const listUsers = async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =========================
// CHANGE PASSWORD
// =========================
export const changePassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid user" });

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok)
      return res.status(400).json({ error: "Current password incorrect" });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: "Password changed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =========================
// COMPANY INFO
// =========================
export const saveCompanyInfo = async (req, res) => {
  try {
    await Company.findOneAndUpdate({}, req.body, { upsert: true, new: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCompanyInfo = async (req, res) => {
  try {
    const d = await Company.findOne({});
    res.json(d || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
