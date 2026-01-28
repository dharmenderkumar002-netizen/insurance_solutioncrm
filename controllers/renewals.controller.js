import GICEntry from "../models/gicentry.js";
import LICEntry from "../models/licentry.js";
import HealthEntry from "../models/healthentry.js";
import NonMotorEntry from "../models/nonmotorentry.js";

function buildRenewalFilter(q) {
  const filter = {};

  // partner
  if (q.partner) filter.partnerId = q.partner;

  // dealer
  if (q.dealer) filter.dealer = q.dealer;

  // insurance company
  if (q.insCo) filter.insuranceCompany = q.insCo;

  // date filter (policyStartDate OR issueDate)
  if (q.from || q.to) {
    filter.policyEndDate = {};
    if (q.from) filter.policyEndDate.$gte = q.from;
    if (q.to) filter.policyEndDate.$lte = q.to;
  }

  return filter;
}

// ---------- GIC ----------
export const gicRenewals = async (req, res) => {
  try {
    const data = await GICEntry.find(buildRenewalFilter(req.query));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------- LIC ----------
export const licRenewals = async (req, res) => {
  try {
    const data = await LICEntry.find(buildRenewalFilter(req.query));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------- HEALTH ----------
export const healthRenewals = async (req, res) => {
  try {
    const data = await HealthEntry.find(buildRenewalFilter(req.query));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------- NON-MOTOR ----------
export const nonMotorRenewals = async (req, res) => {
  try {
    const data = await NonMotorEntry.find(buildRenewalFilter(req.query));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
