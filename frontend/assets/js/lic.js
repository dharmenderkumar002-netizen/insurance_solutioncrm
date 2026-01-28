// LIC page JS
const API = "http://localhost:4000/api";

let licSelectedCustomerId = null;

// ================= INIT =================
function initLIC() {
  loadPartnersForLIC();
  loadInsuranceYearsLIC();
  loadPayTermOptions();
  loadPaymentModesLIC();
  loadBanksLIC();
  setLICDefaultDates();
  loadSavedLIC(); // placeholder display
}

function setLICDefaultDates() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("licIssueDate").value = today;
  document.getElementById("licPremiumPaidDate").value = today;
  document.getElementById("licAmountDate").value = today;
}

// ================= LOAD PARTNERS =================
async function loadPartnersForLIC() {
  try {
    const res = await fetch(`${API}/master/partner`);
    const data = await res.json();
    const sel = document.getElementById("licPartner");
    const sel2 = document.getElementById("licCustPartner");
    sel.innerHTML = "<option value=''>--Select--</option>";
    sel2.innerHTML = "<option value=''>--Select--</option>";
    data.forEach(p => {
      sel.innerHTML += `<option value="${p._id}">${p.name}</option>`;
      sel2.innerHTML += `<option value="${p._id}">${p.name}</option>`;
    });
  } catch (err) {
    console.log("partners load err", err);
  }
}

// ================= LOAD INSURANCE YEARS =================
function loadInsuranceYearsLIC() {
  const sel = document.getElementById("licInsuranceYear");
  const current = new Date().getFullYear();
  sel.innerHTML = "<option value=''>--</option>";
  for (let y = current - 1; y <= current + 1; y++) sel.innerHTML += `<option value="${y}">${y}</option>`;
}

// ================= LOAD PAY TERM =================
function loadPayTermOptions() {
  const sel = document.getElementById("licPayTerm");
  sel.innerHTML = "<option value=''>--</option>";
  for (let i = 1; i <= 45; i++) sel.innerHTML += `<option value="${i}">${i}</option>`;
}

// ================= LOAD PAYMENT MODES & BANKS =================
function loadPaymentModesLIC() {
  const arr = ["Cash","Online","Cheque","DD","NEFT"];
  const sel = document.getElementById("licPaymentMode");
  sel.innerHTML = "<option value=''>--Select--</option>";
  arr.forEach(p => sel.innerHTML += `<option value="${p}">${p}</option>`);
  // also in top payment mode field
  const pm = document.getElementById("licPayMode");
  if (pm) { pm.innerHTML = "<option value=''>--Select--</option>"; arr.forEach(p=>pm.innerHTML += `<option value="${p}">${p}</option>`); }
}

function loadBanksLIC() {
  const arr = ["HDFC","SBI","ICICI","Axis","Other"];
  const sel = document.getElementById("licBank");
  sel.innerHTML = "<option value=''>--Select--</option>";
  arr.forEach(b=>sel.innerHTML += `<option value="${b}">${b}</option>`);
}

// ================= SEARCH CUSTOMER (prefix) =================
let licSearchTimer = null;
async function searchCustomerForLIC() {
  clearTimeout(licSearchTimer);
  licSearchTimer = setTimeout(async () => {
    const q = document.getElementById("licSearch").value.trim();
    const box = document.getElementById("licSearchList");
    if (!q) { box.style.display = "none"; return; }
    try {
      const res = await fetch(`${API}/customer/search?q=${encodeURIComponent(q)}`);
      const arr = await res.json();
      box.innerHTML = "";
      arr.forEach(c => {
        const d = document.createElement("div");
        d.innerText = `${c.name} (${c.mobile || ""})`;
        d.style.padding = "6px 8px"; d.style.cursor = "pointer";
        d.onclick = () => {
          licFillFromCustomer(c);
        };
        box.appendChild(d);
      });
      box.style.display = arr.length ? "block" : "none";
    } catch (err) {
      console.log("search err", err);
    }
  }, 220);
}

function licFillFromCustomer(c) {
  licSelectedCustomerId = c._id;
  document.getElementById("licSearchList").style.display = "none";

  document.getElementById("licSno").value = c.sno || "";
  document.getElementById("licCustomerName").value = c.name || "";
  document.getElementById("licCustomerAddress").value = c.address || "";
  document.getElementById("licPartner").value = c.partner || "";
  document.getElementById("licCustSno").value = c.sno || "";
  document.getElementById("licCustName").value = c.name || "";
  document.getElementById("licCustAddress").value = c.address || "";
  alert("Customer loaded into LIC form");
}

// ================= CUSTOMER POPUP HANDLERS =================
function openLICCustomerPopup() {
  document.getElementById("licCustomerPopup").style.display = "flex";
  document.getElementById("licCustSno").value = "Auto";
}
function licCloseCustomerPopup() {
  document.getElementById("licCustomerPopup").style.display = "none";
}

async function licSaveCustomer() {
  const name = document.getElementById("licCustName").value.trim();
  const address = document.getElementById("licCustAddress").value.trim();
  const partnerId = document.getElementById("licCustPartner").value;
  const status = document.getElementById("licCustStatus").value;

  if (!name || !address) {
    alert("Name & address required");
    return;
  }

  try {
    const res = await fetch(`${API}/customer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, address, partnerId, status })
    });
    const data = await res.json();
    licSelectedCustomerId = data._id;
    document.getElementById("licSno").value = data.sno || "";
    document.getElementById("licCustomerName").value = data.name || "";
    document.getElementById("licCustomerAddress").value = data.address || "";
    document.getElementById("licPartner").value = data.partner || "";
    licCloseCustomerPopup();
    alert("Customer saved and filled");
  } catch (err) {
    console.log("cust save err", err);
    alert("Error saving customer");
  }
}

// ================= FAMILY ROWS =================
function addFamilyRow(name = "", dob = "", relation = "") {
  const tbody = document.querySelector("#familyTable tbody");
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input value="${name}" class="family-name" /></td>
    <td><input type="date" value="${dob}" class="family-dob" /></td>
    <td><input value="${relation}" class="family-relation" /></td>
    <td><button onclick="this.closest('tr').remove()">Remove</button></td>
  `;
  tbody.appendChild(tr);
}

// ================= SAVE LIC ENTRY =================
async function saveLIC() {
  if (!licSelectedCustomerId && !document.getElementById("licCustomerName").value.trim()) {
    alert("Select or add customer");
    return;
  }

  const familyRows = [];
  document.querySelectorAll("#familyTable tbody tr").forEach(tr => {
    const name = tr.querySelector(".family-name").value.trim();
    const dob = tr.querySelector(".family-dob").value;
    const rel = tr.querySelector(".family-relation").value.trim();
    if (name) familyRows.push({ name, dob, relation: rel });
  });

  const body = {
    customerId: licSelectedCustomerId,
    customerName: document.getElementById("licCustomerName").value.trim(),
    customerEmail: "", customerMobile: "",
    planName: Array.from(document.getElementById("licPlan").selectedOptions).map(o=>o.value),
    policyNo: document.getElementById("licPolicyNo").value.trim(),
    endorsementNo: document.getElementById("licEndorsementNo").value.trim(),
    payMode: document.getElementById("licPayMode").value,
    insuranceYear: document.getElementById("licInsuranceYear").value,
    issueDate: document.getElementById("licIssueDate").value,
    startDate: null,
    maturityDate: document.getElementById("licMaturityDate").value,
    premiumPaidDate: document.getElementById("licPremiumPaidDate").value,
    premiumDueDate: document.getElementById("licPremiumDueDate").value,
    premium: Number(document.getElementById("licPremium").value || 0),
    netPremium: Number(document.getElementById("licNetPremium").value || 0),
    otherAdjustment: Number(document.getElementById("licOtherAdjust").value || 0),
    premiumPayingTerm: document.getElementById("licPayTerm").value,
    sumAssured: Number(document.getElementById("licSumAssured").value || 0),
    customerDetails: familyRows,
    previousPolicy: {
      insCo: document.getElementById("licPypInsCo").value,
      endDate: document.getElementById("licPypEndDate").value,
      previousPolicyNo: document.getElementById("licPreviousPolicyNo").value
    },
    amountReceived: {
      amount: Number(document.getElementById("licAmountReceived").value || 0),
      date: document.getElementById("licAmountDate").value,
      paymentMode: document.getElementById("licPaymentMode").value,
      chequeDd: document.getElementById("licChequeDd").value,
      bankName: document.getElementById("licBank").value
    },
    attachments: {}
  };

  try {
    const res = await fetch(`${API}/lic`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    alert("LIC entry saved.");
    loadSavedLIC();
  } catch (err) {
    console.log("lic save err", err);
    alert("Error saving LIC entry");
  }
}

// ================= LOAD SAVED LIC (placeholder) =================
function loadSavedLIC() {
  // backend list endpoint not present yet - showing sample row
  const tbody = document.querySelector("#licTable tbody");
  tbody.innerHTML = `
    <tr>
      <td>Nishika Singh</td>
      <td>LIC Plan A</td>
      <td>2025</td>
      <td>2025-01-20</td>
      <td>12000</td>
      <td>11800</td>
      <td><button>Edit</button></td>
      <td><button>Del</button></td>
    </tr>
  `;
}
