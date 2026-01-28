import Master from "../models/master.model.js";

// 1. GET ALL PARTNERS
export async function getPartners(req, res) {
  try {
    const list = await Master.find({ type: "partner" }).sort({ s_no: 1 });
    res.json({ success: true, data: list });
  } catch (err) {
    console.error("Get Partner Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// 2. ADD PARTNER
export async function addPartner(req, res) {
  try {
    const count = await Master.countDocuments({ type: "partner" });
    const newPartner = await Master.create({
      type: "partner",
      s_no: count + 1,
      name: req.body.partnername,
      mobile: req.body.mobile,
      email: req.body.email,
      inout: req.body.inout,
      status: req.body.status || "Active",
      date: req.body.date || new Date().toISOString().split("T")[0]
    });
    res.status(201).json({ success: true, data: newPartner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// 3. UPDATE PARTNER
export async function updatePartner(req, res) {
  try {
    const updated = await Master.findByIdAndUpdate(
      req.params.id, 
      {
        name: req.body.partnername,
        mobile: req.body.mobile,
        email: req.body.email,
        inout: req.body.inout,
        status: req.body.status,
        date: req.body.date
      }, 
      { new: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// 4. DELETE PARTNER
export async function deletePartner(req, res) {
  try {
    await Master.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}