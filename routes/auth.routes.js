// backend/routes/auth.routes.js

import express from "express";
import { register, login } from "../controllers/auth.controller.js";


const router = express.Router();

// REGISTER (email disabled)
router.post("/register", register);

// LOGIN
router.post("/login", login);


export default router;
