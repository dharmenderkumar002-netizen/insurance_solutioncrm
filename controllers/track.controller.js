import GICEntry from "../models/gicentry.js";
import LICEntry from "../models/licentry.js";
import HealthEntry from "../models/healthentry.js";
import NonMotorEntry from "../models/nonmotorentry.js";

/* =========================================================
   1. FILTER BUILDER (FINAL – DATE + SEARCH SAFE)
========================================================= */
function buildFilters(query, type = 'GIC') {
    console.log("DATE FILTER FIELD:", query.dateFilterField);
    const filter = {};
    const andConditions = [];

    // ✅ PARTNER FILTER
    if (query.partner && query.partner.trim() !== "") {
        filter.partner = query.partner;
    }

    // ✅ DEALER FILTER
    if (query.dealer && query.dealer.trim() !== "") {
        andConditions.push({
            $or: [
                { dealer: query.dealer },
                { dealerName: query.dealer }
            ]
        });
    }

    // ✅ DATE FILTER (CORE REQUIREMENT)
    if (query.from || query.to) {

        const validDateFields = ["odStartDate", "policyIssueDate", "createdAt", "issueDate", "startDate"];
        const dateField = validDateFields.includes(query.dateFilterField)
            ? query.dateFilterField
            : "policyIssueDate";

        const dateCondition = {};

        if (query.from) {
            const fromDate = new Date(query.from);
            fromDate.setHours(0, 0, 0, 0);
            dateCondition.$gte = fromDate;
        }

        if (query.to) {
            const toDate = new Date(query.to);
            toDate.setHours(23, 59, 59, 999);
            dateCondition.$lte = toDate;
        }

        andConditions.push({ [dateField]: dateCondition });
    }

    // ✅ SEARCH FILTER
    if (query.search && query.search.trim() !== "") {
        const regex = new RegExp(query.search, "i");
        let searchConditions;

        switch (type) {
            case 'LIC':
                searchConditions = {
                    $or: [
                        { policyNo: regex },
                        { customerName: regex },
                        { planName: regex }
                    ]
                };
                break;
            case 'NONMOTOR':
                searchConditions = {
                    $or: [
                        { policyNo: regex },
                        { customerName: regex },
                        { product: regex }
                    ]
                };
                break;
            case 'HEALTH':
                searchConditions = {
                    $or: [
                        { policyNo: regex },
                        { customerName: regex },
                        { product: regex }
                    ]
                };
                break;
            case 'GIC':
            default:
                searchConditions = {
                    $or: [
                        { policyNo: regex },
                        { vehicleNo: regex },
                        { vehicleName: regex },
                        { customerName: regex },
                        { chassisNo: regex }
                    ]
                };
                break;
        }
        andConditions.push(searchConditions);
    }

    // ✅ MERGE CONDITIONS
    if (andConditions.length > 0) {
        filter.$and = andConditions;
    }

    return filter;
}

/* =========================================================
   2. DATA STANDARDIZATION (UNCHANGED)
========================================================= */
const standardizeEntry = (doc, type = "GIC") => {
    if (!doc) return null;

    // LIC-specific standardizations
    if (type === 'LIC') {
        return {
            _id: doc._id,
            type,
            customerName: doc.customer?.name || doc.customerName || "-",
            customerMobile: doc.customer?.mobile || doc.customerMobile || "-",
            customerEmail: doc.customer?.email || doc.customeremail ||"-",
            address: doc.customer?.address || "-",
            agentName: doc.partner?.name || doc.partner || "-",
            policyNo: doc.policyNo || "-",
            planName: doc.planName || "-",
            policyIssueDate: doc.policyIssueDate || doc.issueDate,
            startDate: doc.startDate,
            maturityDate: doc.maturityDate,
            premium: Number(doc.premium || 0),
            netPremium: Number(doc.netPremium || 0),
            sumAssured: Number(doc.sumAssured || 0),
            payMode: doc.payMode || "-",
            premiumPaidDate: doc.premiumPaidDate,
            premiumDueDate: doc.premiumDueDate,
            dealerName: doc.dealerName || "-",
            insCompany: doc.insCompany || "-",
            createdAt: doc.createdAt,
            balance: Number(doc.premium || 0) - Number(doc.amountReceived?.amount || 0)
        };
    }
    
    // NONMOTOR-specific standardizations
    if (type === 'NONMOTOR') {
        return {
            _id: doc._id,
            type,
            customerName: doc.customer?.name || doc.customerName || "-",
            customerMobile: doc.customer?.mobile || doc.customerMobile || "-",
            customerEmail: doc.customer?.email || doc.customeremail ||"-",
            address: doc.customer?.address || "-",
            agentName: doc.partner?.name || doc.partner || "-",
            policyNo: doc.policyNo || "-",
            product: doc.product || "-",
            policyType: doc.policyType || "-",
            issueDate: doc.issueDate,
            startDate: doc.startDate,
            endDate: doc.endDate,
            premium: Number(doc.totalPremium || 0),
            netPremium: Number(doc.netPremium || 0),
            sumInsured: Number(doc.sumInsured || 0),
            dealerName: doc.dealerName || "-",
            insuranceCompany: doc.insuranceCompany || "-",
            createdAt: doc.createdAt,
            balance: Number(doc.totalPremium || 0) - Number(doc.payment?.amount || 0)
        };
    }
    // HEALTH-specific standardizations
    if (type === 'HEALTH') {
        return {
            _id: doc._id,
            type,
            customerName: doc.customer?.name || doc.customerName || "-",
            customerMobile: doc.customer?.mobile || doc.customerMobile || "-",
            customerEmail: doc.customer?.email || doc.customeremail ||"-",
            address: doc.customer?.address || "-",
            agentName: doc.partner?.name || doc.partner || "-",
            policyNo: doc.policyNo || "-",
            productName: doc.product || "-",
            policyIssueDate: doc.policyIssueDate || doc.issueDate,
            startDate: doc.startDate,
            endDate: doc.endDate,
            premium: Number(doc.premium || 0),
            netPremium: Number(doc.netPremium || 0),
            sumAssured: Number(doc.sumAssured || 0),
            dealerName: doc.dealerName || "-",
            insuranceCompany: doc.insCompany || "-",
            createdAt: doc.createdAt,
            balance: Number(doc.premium || 0) - Number(doc.amountReceived?.amount || 0)
        };
    }

    // Default GIC standardization
    return {
        _id: doc._id,
        type,

        // CUSTOMER
        customerName: doc.customer?.name || doc.customerName || "-",
        customerMobile: doc.customer?.mobile || doc.customerMobile || "-",
        customerEmail: doc.customer?.email || doc.customeremail ||"-",
        address: doc.customer?.address || "-",

        // AGENT
        agentName: doc.partner?.name || "-",

        // POLICY
        policyNo: doc.policyNo || "-",
        policyType: doc.policyType || "-",
        coverageType: doc.coverageType || "-",
        insuranceYear: doc.insuranceYear || "-",
        policyIssueDate: doc.policyIssueDate || doc.issueDate,

        // VEHICLE
        vehicleNo: doc.vehicleNo || "-",
        vehicleName: doc.vehicleName || "-",
        vehicleRegDate: doc.vehicleRegDate || null,
        fuel: doc.fuel || "-",
        ccKwGvw: doc.ccKwGvw || "-",
        ncb: Number(doc.ncb) || 0,   // ✅ FINAL FIX
        vehicleClass: doc.vehicleClass || "-",
        chassisNo: doc.chassisNo || "-",
        engineNo: doc.engineNo || "-",

        // DATES
        odStartDate: doc.odStartDate,
        odEndDate: doc.odEndDate,
        tpStartDate: doc.tpStartDate,
        tpEndDate: doc.tpEndDate,
        createdAt: doc.createdAt,

        // DEALER / COMPANY / PRODUCT
        dealerName: doc.dealerName || "-",
        insuranceCompany: doc.insCompany || "-",
        productName: doc.gicProduct || doc.product?.name || "-",
        trailorType: doc.trailorType || "-",

        // FINANCIAL
        idv: Number(doc.idv || 0),
        odPremium: Number(doc.odPremium || 0),
        discount: Number(doc.discount || 0),
        netPremium: Number(doc.netPremium || 0),
        premium: Number(doc.premium || 0),
        pa: Number(doc.pa || 0),
        patopass: Number(doc.paToPass || 0),
        paTaxi: Number(doc.paTaxi || 0),

        // PAYMENT
        receivedDate: doc.amountReceived?.date || null,
        paymentMode: doc.amountReceived?.paymentMode || "-",
        chequeDetails: doc.amountReceived?.chequeDd || "-",
        bankName: doc.amountReceived?.bankName || "-",

        // PREVIOUS POLICY
        previousPolicyNo: doc.previousPolicy?.previousPolicyNo || "-",
        pypInsCo: doc.previousPolicy?.insCo || "-",
        pypEndDate: doc.previousPolicy?.endDate || null,

        // BALANCE
        balance: Number(doc.premium || 0) - Number(doc.amountReceived?.amount || 0)
    };
};

/* =========================================================
   3. CONTROLLERS
========================================================= */

// ⭐ GIC
export const trackGIC = async (req, res) => {
    try {
        const filters = buildFilters(req.query, 'GIC');

        const data = await GICEntry.find(filters)
            .populate("customer", "name mobile email address")
            .populate("partner", "name")
            .populate("product", "name")
            .sort({ createdAt: -1 })
            .lean();

        res.json(data.map(d => standardizeEntry(d, "GIC")));
    } catch (err) {
        console.error("TRACK GIC ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

// ⭐ LIC
export const trackLIC = async (req, res) => {
    try {
        const licQuery = { ...req.query };
        if (!licQuery.dateFilterField) {
            licQuery.dateFilterField = 'issueDate';
        }
        const filters = buildFilters(licQuery, 'LIC');
        const data = await LICEntry.find(filters)
            .populate("customer")
            .sort({ createdAt: -1 })
            .lean();

        res.json(data.map(d => standardizeEntry(d, "LIC")));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ⭐ HEALTH
export const trackHealth = async (req, res) => {
    try {
        const filters = buildFilters(req.query, 'HEALTH'); // Assuming HEALTH might have its own logic
        const data = await HealthEntry.find(filters)
            .populate("customer")
            .sort({ createdAt: -1 })
            .lean();

        res.json(data.map(d => standardizeEntry(d, "HEALTH")));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ⭐ NON-MOTOR
export const trackNonMotor = async (req, res) => {
    try {
        const filters = buildFilters(req.query, 'NONMOTOR');
        const data = await NonMotorEntry.find(filters)
            .populate("customer")
            .sort({ createdAt: -1 })
            .lean();

        res.json(data.map(d => standardizeEntry(d, "NONMOTOR")));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ⭐ ALL SERVICES
export const trackAll = async (req, res) => {
    try {
        const gicFilters = buildFilters(req.query, 'GIC');
        const licFilters = buildFilters(req.query, 'LIC');
        const nonMotorFilters = buildFilters(req.query, 'NONMOTOR');
        const healthFilters = buildFilters(req.query, 'HEALTH');


        const [gic, lic, health, nonmotor] = await Promise.all([
            GICEntry.find(gicFilters).populate("customer partner product").lean(),
            LICEntry.find(licFilters).populate("customer").lean(),
            HealthEntry.find(healthFilters).populate("customer").lean(),
            NonMotorEntry.find(nonMotorFilters).populate("customer").lean()
        ]);

        const merged = [
            ...gic.map(d => standardizeEntry(d, "GIC")),
            ...lic.map(d => standardizeEntry(d, "LIC")),
            ...health.map(d => standardizeEntry(d, "HEALTH")),
            ...nonmotor.map(d => standardizeEntry(d, "NONMOTOR"))
        ];

        merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(merged);
    } catch (err) {
        console.error("Error in trackAll:", err);
        res.status(500).json({ error: err.message });
    }
};
