// backend/controllers/auth.controller.js

import user from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* -----------------------------------------
   EMAIL SYSTEM DISABLED FOR NOW
   YOU CAN ENABLE LATER ANYTIME
------------------------------------------ */

// REGISTER (NO EMAIL, NO APPROVAL)
export const register = async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;

    if (!name || !mobile || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    if (!/^\d{10}$/.test(mobile))
      return res.status(400).json({ message: "Mobile must be 10 digits" });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(400).json({ message: "User with email exists" });

    const hashed = await bcrypt.hash(password, 10);

    // DIRECT ACTIVE USER
    const newUser = await User.create({
      name,
      mobile,
      email: email.toLowerCase(),
      password: hashed,
      approvedBy: "SYSTEM",
      status: "active",
      role: "user"
    });

    return res.status(201).json({
      message: "Registration successful! You can now login.",
      userId: newUser._id
    });

  } catch (err) {
    console.error("Register err:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for email: ${email}`);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log(`User not found for email: ${email}`);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    console.log("User found:", user);

    if (user.status !== "active") {
      console.log(`User not active: ${user.status}`);
      return res.status(403).json({ message: "User not approved" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      console.log("Password comparison failed");
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({ message: "Login successful", token, user });

  } catch (err) {
    console.log("Login error", err);
    return res.status(500).json({ message: "Server error" });
  }
};


/* -----------------------------------------
   APPROVAL SYSTEM DISABLED
------------------------------------------ */

// export const approveUser = async (req, res) => {
//   return res.status(403).send("Approval system disabled for now.");
// };
