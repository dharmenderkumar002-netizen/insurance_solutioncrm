// controllers/customer.controller.js

import customer from "../models/customer.js";

export async function addCustomer(req, res) {
    try {
        console.log("Received Body:", req.body); // Debugging
        console.log("Received Files:", req.files); // Debugging

        // 1. Destructure Text Fields
        const { 
            name, 
            address, 
            mobile, 
            email,
            partnerName, 
            status
        } = req.body;

        // 2. Handle File Uploads (Map Frontend 'panFile' -> DB 'panAttachment')
        // req.files is an object where keys are field names
        const panAttachment = (req.files && req.files['panFile']) ? req.files['panFile'][0].filename : "";
        const aadharAttachment = (req.files && req.files['adharFile']) ? req.files['adharFile'][0].filename : "";
        const gstAttachment = (req.files && req.files['gstFile']) ? req.files['gstFile'][0].filename : "";

        // 3. Prepare Data Object
        const dataToSave = {
            name,
            address,
            mobile,
            email,
            status,
            panAttachment,    // Saved as "panFile-123456.jpg"
            aadharAttachment,
            gstAttachment,
            partnerName: (partnerName && partnerName.trim() !== "") ? partnerName.trim() : "",
            updatedAt: new Date()
        };

        // 4. Validation
        if (!mobile) {
            return res.status(400).json({ success: false, message: "Mobile number is required." });
        }

        // 5. S.No. Calculation
        const last = await Customer.findOne().sort({ sno: -1 });
        dataToSave.sno = last ? last.sno + 1 : 1;

        // 6. Save to DB
        const saved = await Customer.create(dataToSave);

        res.status(201).json({ success: true, message: "Customer saved successfully", data: saved });

    } catch (err) {
        console.error("AddCustomer Error:", err);
        
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: `Validation Failed: ${messages.join(', ')}` });
        }
        
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: "Duplicate key error: Record already exists." });
        }

        res.status(500).json({ success: false, message: "Server error occurred while processing the request." });
    }
}

export async function searchCustomers(req, res) {
    try {
        const q = req.query.q || "";
        const list = await Customer.find({
            $or: [
                { name: new RegExp(q, "i") },
                { mobile: new RegExp(q, "i") }
            ]
        }).limit(20);

        res.json({ success: true, data: list }); 
    } catch (err) {
        console.error("Search Error:", err);
        res.status(500).json({ success: false, error: "Server error" });
    }
}