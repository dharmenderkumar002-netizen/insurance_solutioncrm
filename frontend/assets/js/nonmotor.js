// nonmotor.js — Non Motor Frontend Logic
const API = "http://localhost:4000/api";

let nmSelectedCustomerId = null;

// ================= INIT =================
function initNonMotor() {
  loadPartnersNM();
  loadInsuranceYearNM();
  loadInsuranceCompaniesNM();
  loadPaymentModesNM();
  loadBanksNM();
  setNMDefaultDates();
  loadSavedNM(); // sample row for now
}

function setNMDefaultDates() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("nmIssueDate").value = today;
  document.getElementById("nmStartDate").value = today;
  document.getElementById("nmAmountDate").value = today;
}

// ========== LOAD PARTNERS ==========
async function loadPartnersNM() {
  try {
    const res = await fetch(`${API}/master/partner`);
    const data = await res.json();
    const sel1 = document.getElementById("nmPartner");
    const sel2 = document.getElementById("nmCustPartner");
    const dealer = document.getElementById("nmDealer");
    sel1.innerHTML = "<option value=''>--Select--</option>";
    sel2.innerHTML = "<option value=''>--Select--</option>";
    dealer.innerHTML = "<option value=''>--Select--</option>";
    data.forEach(p=>{
      sel1.innerHTML += `<option value="${p._id}">${p.name}</option>`;
      sel2.innerHTML += `<option value="${p._id}">${p.name}</option>`;
      dealer.innerHTML += `<option value="${p._id}">${p.name}</option>`;
    });
  } catch (err) { console.log("partner err", err); }
}

// ========== INSURANCE YEAR ==========
function loadInsuranceYearNM() {
  const sel = document.getElementById("nmInsuranceYear");
  const y = new Date().getFullYear();
  sel.innerHTML = `<option value="">--</option>
                   <option value="${y-1}">${y-1}</option>
                   <option value="${y}">${y}</option>
                   <option value="${y+1}">${y+1}</option>`;
}

// ========== INSURANCE COMPANIES ==========
function loadInsuranceCompaniesNM() {
  const list = ["IFFCO Tokio","HDFC ERGO","ICICI Lombard","Royal Sundaram","Other"];
  const sel = document.getElementById("nmInsuranceCo");
  const sel2 = document.getElementById("nmPypInsCo");
  sel.innerHTML = "<option value=''>--Select--</option>";
  sel2.innerHTML = "<option value=''>--Select--</option>";
  list.forEach(i=>{
    sel.innerHTML += `<option>${i}</option>`;
    sel2.innerHTML += `<option>${i}</option>`;
  });
}

// ========== PAYMENT MODES ==========
function loadPaymentModesNM() {
  const arr = ["Cash","Online","Cheque","DD","NEFT"];
  const sel = document.getElementById("nmPaymentMode");
  sel.innerHTML = "<option value=''>--Select--</option>";
  arr.forEach(a=> sel.innerHTML += `<option value="${a}">${a}</option>`);
}

// ========== BANKS ==========
function loadBanksNM() {
  const arr = ["HDFC","SBI","ICICI","Axis","Other"];
  const sel = document.getElementById("nmBank");
  sel.innerHTML = "<option value=''>--Select--</option>";
  arr.forEach(b=> sel.innerHTML += `<option value="${b}">${b}</option>`);
}

// ========== SEARCH CUSTOMER ==========
let nmSearchTimer = null;
async function searchCustomerForNM() {
  clearTimeout(nmSearchTimer);
  nmSearchTimer = setTimeout(async ()=>{
    const q = document.getElementById("nmSearch").value.trim();
    const box = document.getElementById("nmSearchList");
    if (!q) { box.style.display = "none"; return; }

    try {
      const res = await fetch(`${API}/customer/search?q=${encodeURIComponent(q)}`);
      const arr = await res.json();
      box.innerHTML = "";
      arr.forEach(c=>{
        const d = document.createElement("div");
        d.innerText = `${c.name} (${c.mobile || ""}) - ${c.address || ""}`;
        d.style.padding = "6px 8px"; d.style.cursor = "pointer";
        d.onclick = ()=> nmFillFromCustomer(c);
        box.appendChild(d);
      });
      box.style.display = arr.length ? "block" : "none";
    } catch (err) { console.log("search err", err); }
  }, 220);
}

function nmFillFromCustomer(c) {
  nmSelectedCustomerId = c._id;
  document.getElementById("nmSearchList").style.display = "none";

  document.getElementById("nmSno").value = c.sno || "";
  document.getElementById("nmCustomerName").value = c.name || "";
  document.getElementById("nmCustomerAddress").value = c.address || "";
  document.getElementById("nmPartner").value = c.partner || "";

  document.getElementById("nmCustSno").value = c.sno || "";
  document.getElementById("nmCustName").value = c.name || "";
  document.getElementById("nmCustAddress").value = c.address || "";

  alert("Customer loaded into Non Motor form");
}

// ========== CUSTOMER POPUP ==========
function openNMCustomerPopup() {
  document.getElementById("nmCustomerPopup").style.display = "flex";
  document.getElementById("nmCustSno").value = "Auto";
}
function closeNMCustomerPopup() {
  document.getElementById("nmCustomerPopup").style.display = "none";
}

async function nmSaveCustomer() {
  const name = document.getElementById("nmCustName").value.trim();
  const address = document.getElementById("nmCustAddress").value.trim();
  const partnerId = document.getElementById("nmCustPartner").value;
  const status = document.getElementById("nmCustStatus").value;

  if (!name || !address) { alert("Name & address required"); return; }

  try {
    const res = await fetch(`${API}/customer`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ name, address, partnerId, status })
    });
    const data = await res.json();
    nmSelectedCustomerId = data._id;

    document.getElementById("nmSno").value = data.sno || "";
    document.getElementById("nmCustomerName").value = data.name || "";
    document.getElementById("nmCustomerAddress").value = data.address || "";
    document.getElementById("nmPartner").value = data.partner || "";

    closeNMCustomerPopup();
    alert("Customer saved & filled");
  }
  catch(err) { console.log(err); alert("Customer save error"); }
}

// ========== SAVE NON MOTOR ENTRY ==========
async function saveNonMotor() {
  if (!nmSelectedCustomerId && !document.getElementById("nmCustomerName").value.trim()) {
    alert("Select or add customer first");
    return;
  }

  const body = {
    customerId: nmSelectedCustomerId,
    customerName: document.getElementById("nmCustomerName").value.trim(),
    product: Array.from(document.getElementById("nmProduct").selectedOptions).map(o=>o.value),
    policyNo: document.getElementById("nmPolicyNo").value,
    endorsementNo: document.getElementById("nmEndorsementNo").value,
    policyType: document.getElementById("nmPolicyType").value,
    insuranceYear: document.getElementById("nmInsuranceYear").value,

    issueDate: document.getElementById("nmIssueDate").value,
    startDate: document.getElementById("nmStartDate").value,
    endDate: document.getElementById("nmEndDate").value,

    sumAssured: Number(document.getElementById("nmSumAssured").value || 0),
    premium: Number(document.getElementById("nmPremium").value || 0),
    otherAdjust: Number(document.getElementById("nmOtherAdjust").value || 0),
    net: Number(document.getElementById("nmNet").value || 0),
    terrorismPremium: Number(document.getElementById("nmTerrorism").value || 0),

    dealer: document.getElementById("nmDealer").value,
    insuranceCo: document.getElementById("nmInsuranceCo").value,

    previousPolicy: {
      insCo: document.getElementById("nmPypInsCo").value,
      endDate: document.getElementById("nmPypEndDate").value,
      previousPolicyNo: document.getElementById("nmPreviousPolicyNo").value
    },

    amountReceived: {
      amount: Number(document.getElementById("nmAmountReceived").value || 0),
      date: document.getElementById("nmAmountDate").value,
      paymentMode: document.getElementById("nmPaymentMode").value,
      chequeDd: document.getElementById("nmChequeDd").value,
      bankName: document.getElementById("nmBank").value
    },
    attachments: {}
  };

  try {
    const res = await fetch(`${API}/nonmotor`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify(body)
    });
    const data = await res.json();
    alert("Non Motor Entry Saved");
    loadSavedNM();
  }
  catch(err){
    console.log(err);
    alert("Save error");
  }
}

// ========== LOAD SAVED (sample) ==========
function loadSavedNM() {
  const tbody = document.querySelector("#nmTable tbody");
  tbody.innerHTML = `
    <tr>
      <td>Rahul Kumar</td>
      <td>Fire Policy</td>
      <td>2025</td>
      <td>2025-01-20</td>
      <td>8000</td>
      <td>7850</td>
      <td><button>Edit</button></td>
      <td><button>Del</button></td>
    </tr>
  `;
}
