// ===========================================
// GIC PAGE JAVASCRIPT (FULL WORKING LOGIC)
// ===========================================

const API = "http://localhost:4000/api";

let selectedCustomerId = null;
let selectedGicId = null;

// ==================== INIT GIC PAGE ======================
async function initGIC() {
    loadPartners();
    loadMasterDropdowns();
    loadGicProducts();
    loadInsuranceYears();
    loadPaymentModes();
    loadBanks();
    loadInsuranceCompanies();
    loadSavedGIC();
    setTodayDates();
}

// ==================== SET DEFAULT DATES ======================
function setTodayDates() {
    let today = new Date().toISOString().split("T")[0];
    document.getElementById("policyIssueDate").value = today;
    document.getElementById("amountDate").value = today;
}

// ==================== SEARCH GIC / CUSTOMER ======================
async function searchGIC() {
    let q = document.getElementById("searchBox").value.trim();
    let box = document.getElementById("searchList");

    if (!q) {
        box.style.display = "none";
        return;
    }

    const res = await fetch(`${API}/gic/autocomplete?q=${q}`);
    const data = await res.json();

    box.innerHTML = "";

    // Customer suggestion
    data.customers.forEach(c => {
        let d = document.createElement("div");
        d.innerText = c.name + " (" + (c.mobile || "") + ")";
        d.onclick = () => fillFromCustomer(c);
        box.appendChild(d);
    });

    // GIC entries suggestion
    data.gics.forEach(g => {
        let d = document.createElement("div");
        d.innerText = g.policyNo + " | " + g.vehicleNo;
        d.onclick = () => fillFromGIC(g._id);
        box.appendChild(d);
    });

    box.style.display = "block";
}

// ==================== FILL FROM CUSTOMER =====================
function fillFromCustomer(c) {
    selectedCustomerId = c._id;
    document.getElementById("searchList").style.display = "none";

    document.getElementById("sno").value = c.sno;
    document.getElementById("customerName").value = c.name;
    document.getElementById("customerEmail").value = c.email || "";
    document.getElementById("customerMobile").value = c.mobile || "";

    loadPartners(c.partner);

    alert("Customer loaded.");
}

// ==================== FILL FROM FULL GIC ENTRY =====================
async function fillFromGIC(id) {
    selectedGicId = id;
    document.getElementById("searchList").style.display = "none";

    const res = await fetch(`${API}/gic/${id}`);
    const g = await res.json();

    selectedCustomerId = g.customer?._id;

    // CUSTOMER BASIC
    document.getElementById("sno").value = g.customer?.sno;
    document.getElementById("customerName").value = g.customer?.name;
    document.getElementById("customerEmail").value = g.customer?.email;
    document.getElementById("customerMobile").value = g.customer?.mobile;

    loadPartners(g.partner?._id);

    // GIC FIELDS
    document.getElementById("policyNo").value = g.policyNo;
    document.getElementById("idv").value = g.idv;
    document.getElementById("vehicleNo").value = g.vehicleNo;
    document.getElementById("vehicleName").value = g.vehicleName;
    document.getElementById("insuranceYear").value = g.insuranceYear;

    document.getElementById("policyIssueDate").value = g.policyIssueDate?.split("T")[0];
    document.getElementById("odStartDate").value = g.odStartDate?.split("T")[0];
    document.getElementById("odEndDate").value = g.odEndDate?.split("T")[0];
    document.getElementById("tpStartDate").value = g.tpStartDate?.split("T")[0];
    document.getElementById("tpEndDate").value = g.tpEndDate?.split("T")[0];

    document.getElementById("premium").value = g.premium;
    document.getElementById("net").value = g.net;
    document.getElementById("od").value = g.od;

    document.getElementById("dealer").value = g.dealer;
    document.getElementById("insuranceCo").value = g.insuranceCompany;
    document.getElementById("discount").value = g.discount;

    document.getElementById("engineNo").value = g.engineNo;
    document.getElementById("chassisNo").value = g.chassisNo;
    document.getElementById("ncb").value = g.ncb;

    alert("GIC entry loaded.");
}

// ==================== LOAD DROPDOWNS ======================
async function loadPartners(selected = null) {
    const res = await fetch(`${API}/master/partner`);
    const data = await res.json();

    let sel1 = document.getElementById("partner");
    let sel2 = document.getElementById("custPartner");

    sel1.innerHTML = "";
    sel2.innerHTML = "";

    data.forEach(p => {
        let op = `<option value="${p._id}" ${selected === p._id ? "selected" : ""}>${p.name}</option>`;
        sel1.innerHTML += op;
        sel2.innerHTML += op;
    });
}

function loadMasterDropdowns() {
    loadCoverageTypes();
    loadFuelTypes();
}

async function loadCoverageTypes() {
    // Will implement master route later
}

async function loadFuelTypes() {
    // Add after master pages
}

async function loadGicProducts() {
    // Add later
}

async function loadInsuranceYears() {
    // Add later
}

async function loadPaymentModes() {
    // Add later
}

async function loadBanks() {
    // Add later
}

async function loadInsuranceCompanies() {
    // Add later
}

// ===================== VEHICLE NAME SUGGESTION ==================
async function searchVehicle() {
    let q = document.getElementById("vehicleName").value.trim();
    let box = document.getElementById("vehicleSuggestion");

    if (!q) {
        box.style.display = "none";
        return;
    }

    // This will use master vehicle list (later)
    // For now: dummy options
    let sample = ["Honda Activa", "Suzuki Access", "Hero Splendor", "Hyundai i10", "Maruti Swift"];

    box.innerHTML = "";
    sample
        .filter(v => v.toLowerCase().startsWith(q.toLowerCase()))
        .forEach(item => {
            let d = document.createElement("div");
            d.innerText = item;
            d.style.padding = "6px 8px";
            d.style.cursor = "pointer";
            d.onclick = () => {
                document.getElementById("vehicleName").value = item;
                box.style.display = "none";
            };
            box.appendChild(d);
        });

    box.style.display = "block";
}

// ===================== OPEN / CLOSE POPUP ==================
function openCustomerPopup() {
    document.getElementById("customerPopup").style.display = "flex";
    document.getElementById("custSno").value = "Auto";
}
function closeCustomerPopup() {
    document.getElementById("customerPopup").style.display = "none";
}

// ===================== SAVE CUSTOMER ==================
async function saveCustomer() {
    const name = document.getElementById("custName").value.trim();
    const address = document.getElementById("custAddress").value.trim();
    const partnerId = document.getElementById("custPartner").value;

    if (!name || !address) {
        alert("Please fill customer name & address");
        return;
    }

    const res = await fetch(`${API}/customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name,
            address,
            partnerId,
            status: document.getElementById("custStatus").value
        })
    });

    const data = await res.json();

    alert("Customer Saved!");
    closeCustomerPopup();

    // Auto fill GIC form fields
    selectedCustomerId = data._id;
    document.getElementById("customerName").value = data.name;
    document.getElementById("customerEmail").value = data.email || "";
    document.getElementById("customerMobile").value = data.mobile || "";
    document.getElementById("sno").value = data.sno;
}

// ===================== SAVE GIC ENTRY ==================
async function saveGIC() {
    if (!selectedCustomerId) {
        alert("Select or add customer first");
        return;
    }

    let body = {
        customerId: selectedCustomerId,
        customerName: document.getElementById("customerName").value,
        customerEmail: document.getElementById("customerEmail").value,
        customerMobile: document.getElementById("customerMobile").value,

        partnerId: document.getElementById("partner").value,
        policyNo: document.getElementById("policyNo").value,
        coverageType: document.getElementById("coverageType").value,
        fuelType: document.getElementById("fuelType").value,
        policyType: document.getElementById("policyType").value,
        idv: document.getElementById("idv").value,
        vehicleNo: document.getElementById("vehicleNo").value,
        vehicleName: document.getElementById("vehicleName").value,
        insuranceYear: document.getElementById("insuranceYear").value,

        policyIssueDate: document.getElementById("policyIssueDate").value,
        odStartDate: document.getElementById("odStartDate").value,
        odEndDate: document.getElementById("odEndDate").value,
        tpStartDate: document.getElementById("tpStartDate").value,
        tpEndDate: document.getElementById("tpEndDate").value,

        premium: document.getElementById("premium").value,
        net: document.getElementById("net").value,
        od: document.getElementById("od").value,

        dealer: document.getElementById("dealer").value,
        insuranceCompany: document.getElementById("insuranceCo").value,
        discount: document.getElementById("discount").value,

        engineNo: document.getElementById("engineNo").value,
        chassisNo: document.getElementById("chassisNo").value,
        ncb: document.getElementById("ncb").value,

        previousPolicy: {
            insCo: document.getElementById("pypInsCo").value,
            endDate: document.getElementById("pypEndDate").value,
            previousPolicyNo: document.getElementById("previousPolicyNo").value
        },

        amountReceived: {
            date: document.getElementById("amountDate").value,
            paymentMode: document.getElementById("paymentMode").value,
            chequeDd: document.getElementById("chequeDd").value,
            bankName: document.getElementById("bankName").value
        }
    };

    const res = await fetch(`${API}/gic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const data = await res.json();

    alert("GIC Entry Saved!");

    loadSavedGIC();
}

// ===================== LOAD SAVED GIC IN TABLE ==================
async function loadSavedGIC() {
    // As backend list route not made, show dummy for now
    // You will add GIC list route later

    let tbody = document.querySelector("#gicTable tbody");
    tbody.innerHTML = `
        <tr>
            <td>DL1AB1234</td>
            <td>Honda Activa</td>
            <td>2025</td>
            <td>2025-01-20</td>
            <td>5000</td>
            <td>4800</td>
            <td><button>Edit</button></td>
            <td><button>Del</button></td>
        </tr>
    `;
}
