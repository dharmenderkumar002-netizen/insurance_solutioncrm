// health.js — frontend logic for Health page
const API = "http://localhost:4000/api";

let healthSelectedCustomerId = null;

// ========== INIT ==========
function initHealth() {
  loadPartnersForHealth();
  loadInsuranceYearsHealth();
  loadPaymentModesHealth();
  loadBanksHealth();
  loadInsuranceCompaniesHealth();
  setHealthDefaultDates();
  loadSavedHealth(); // placeholder
}

function setHealthDefaultDates() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("healthIssueDate").value = today;
  document.getElementById("healthStartDate").value = today;
  document.getElementById("healthAmountDate").value = today;
}

// ========== LOAD MASTERS ==========
async function loadPartnersForHealth() {
  try {
    const res = await fetch(`${API}/master/partner`);
    const list = await res.json();
    const sel = document.getElementById("healthPartner");
    const sel2 = document.getElementById("healthCustPartner");
    const dealer = document.getElementById("healthDealer");
    sel.innerHTML = "<option value=''>--Select--</option>";
    sel2.innerHTML = "<option value=''>--Select--</option>";
    dealer.innerHTML = "<option value=''>--Select--</option>";
    list.forEach(p=>{
      sel.innerHTML += `<option value="${p._id}">${p.name}</option>`;
      sel2.innerHTML += `<option value="${p._id}">${p.name}</option>`;
      dealer.innerHTML += `<option value="${p._id}">${p.name}</option>`;
    });
  } catch (err) { console.log("partners err", err); }
}

function loadInsuranceYearsHealth() {
  const sel = document.getElementById("healthInsuranceYear");
  const current = new Date().getFullYear();
  sel.innerHTML = "<option value=''>--</option>";
  for (let y = current-1; y <= current+1; y++) sel.innerHTML += `<option value="${y}">${y}</option>`;
}

function loadPaymentModesHealth() {
  const arr = ["Cash","Online","Cheque","DD","NEFT"];
  const sel = document.getElementById("healthPaymentMode");
  sel.innerHTML = "<option value=''>--Select--</option>";
  arr.forEach(a=> sel.innerHTML += `<option value="${a}">${a}</option>`);
}

function loadBanksHealth() {
  const arr = ["HDFC","SBI","ICICI","Axis","Other"];
  const sel = document.getElementById("healthBank");
  sel.innerHTML = "<option value=''>--Select--</option>";
  arr.forEach(b=> sel.innerHTML += `<option value="${b}">${b}</option>`);
}

function loadInsuranceCompaniesHealth() {
  const arr = ["Star Health","Max Bupa","HDFC ERGO","ICICI Lombard","Other"];
  const sel = document.getElementById("healthInsuranceCo");
  sel.innerHTML = "<option value=''>--Select--</option>";
  arr.forEach(i => sel.innerHTML += `<option value="${i}">${i}</option>`);
}

// ========== SEARCH CUSTOMER PREFIX ==========
let healthSearchTimer = null;
async function searchCustomerForHealth() {
  clearTimeout(healthSearchTimer);
  healthSearchTimer = setTimeout(async ()=>{
    const q = document.getElementById("healthSearch").value.trim();
    const box = document.getElementById("healthSearchList");
    if (!q) { box.style.display = "none"; return; }
    try {
      const res = await fetch(`${API}/customer/search?q=${encodeURIComponent(q)}`);
      const arr = await res.json();
      box.innerHTML = "";
      arr.forEach(c=>{
        const d = document.createElement("div");
        d.style.padding = "6px 8px"; d.style.cursor = "pointer";
        d.innerText = `${c.name} (${c.mobile || ""}) - ${c.address || ""}`;
        d.onclick = ()=> { healthFillFromCustomer(c); };
        box.appendChild(d);
      });
      box.style.display = arr.length ? "block" : "none";
    } catch (err) { console.log("search err", err); }
  }, 220);
}

function healthFillFromCustomer(c) {
  healthSelectedCustomerId = c._id;
  document.getElementById("healthSearchList").style.display = "none";
  document.getElementById("healthSno").value = c.sno || "";
  document.getElementById("healthCustomerName").value = c.name || "";
  document.getElementById("healthCustomerAddress").value = c.address || "";
  document.getElementById("healthPartner").value = c.partner || "";
  document.getElementById("healthCustSno").value = c.sno || "";
  document.getElementById("healthCustName").value = c.name || "";
  document.getElementById("healthCustAddress").value = c.address || "";
  alert("Customer loaded into Health form");
}

// ========== CUSTOMER POPUP ==========
function openHealthCustomerPopup() {
  document.getElementById("healthCustomerPopup").style.display = "flex";
  document.getElementById("healthCustSno").value = "Auto";
}
function healthCloseCustomerPopup() {
  document.getElementById("healthCustomerPopup").style.display = "none";
}

async function healthSaveCustomer() {
  const name = document.getElementById("healthCustName").value.trim();
  const address = document.getElementById("healthCustAddress").value.trim();
  const partnerId = document.getElementById("healthCustPartner").value;
  const status = document.getElementById("healthCustStatus").value;
  if (!name || !address) { alert("Name & address required"); return; }

  try {
    const res = await fetch(`${API}/customer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, address, partnerId, status })
    });
    const data = await res.json();
    healthSelectedCustomerId = data._id;
    document.getElementById("healthSno").value = data.sno || "";
    document.getElementById("healthCustomerName").value = data.name || "";
    document.getElementById("healthCustomerAddress").value = data.address || "";
    document.getElementById("healthPartner").value = data.partner || "";
    healthCloseCustomerPopup();
    alert("Customer saved and filled");
  } catch (err) { console.log("cust save err", err); alert("Error saving customer"); }
}

// ========== FAMILY ROWS ==========
function addHealthMemberRow(name = "", dob = "", relation = "") {
  const tbody = document.querySelector("#healthFamilyTable tbody");
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input value="${name}" class="member-name" /></td>
    <td><input type="date" value="${dob}" class="member-dob" /></td>
    <td><input value="${relation}" class="member-rel" /></td>
    <td><button onclick="this.closest('tr').remove()">Remove</button></td>
  `;
  tbody.appendChild(tr);
}

// ========== SAVE HEALTH ENTRY ==========
async function saveHealth() {
  if (!healthSelectedCustomerId && !document.getElementById("healthCustomerName").value.trim()) {
    alert("Select or add customer");
    return;
  }

  const family = [];
  document.querySelectorAll("#healthFamilyTable tbody tr").forEach(tr=>{
    const name = tr.querySelector(".member-name").value.trim();
    const dob = tr.querySelector(".member-dob").value;
    const rel = tr.querySelector(".member-rel").value.trim();
    if (name) family.push({ name, dob, relation: rel });
  });

  const body = {
    customerId: healthSelectedCustomerId,
    customerName: document.getElementById("healthCustomerName").value.trim(),
    product: Array.from(document.getElementById("healthPlan").selectedOptions).map(o=>o.value),
   
