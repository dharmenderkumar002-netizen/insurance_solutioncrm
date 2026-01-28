const API = "http://localhost:4000/api";

let renewalType = "gic";
let renewalRaw = [];

// Table headers for each type
const RHEAD = {
  gic: ["Customer","Policy No","Vehicle No","Vehicle Name","InsuranceYear","IssueDate","EndDate","Premium","Net","Dealer","InsCo"],
  lic: ["Customer","Policy No","Plan","IssueDate","EndDate","Premium","Net","Dealer","InsCo"],
  health: ["Customer","Policy No","Plan","IssueDate","EndDate","Premium","Net","Dealer","InsCo"],
  nonmotor: ["Customer","Policy No","Product","IssueDate","EndDate","Premium","Net","Dealer","InsCo"]
};

// ---------- INIT ----------
async function initRenewalPage(type) {
  renewalType = type;

  await loadRenewalFilters();
  await loadRenewalData();
  renderRenewalTable();
}

// ---------- LOAD FILTER DROPDOWNS ----------
async function loadRenewalFilters() {
  // partner
  try {
    const res = await fetch(`${API}/master/partner`);
    const list = await res.json();
    const sel = document.getElementById("filterPartner");
    sel.innerHTML = "<option value=''>All</option>";
    list.forEach(p => {
      sel.innerHTML += `<option value="${p._id}">${p.name}</option>`;
    });
  } catch(err){}

  // dealers (demo)
  const dealerSel = document.getElementById("filterDealer");
  dealerSel.innerHTML = "<option value=''>All</option>";
  ["Dealer A","Dealer B","Dealer C"].forEach(d => {
    dealerSel.innerHTML += `<option>${d}</option>`;
  });

  // insurance companies (demo)
  const insSel = document.getElementById("filterInsCo");
  insSel.innerHTML = "<option value=''>All</option>";
  ["HDFC ERGO","ICICI Lombard","Star Health","Max Bupa"].forEach(i=>{
    insSel.innerHTML += `<option>${i}</option>`;
  });
}

// ---------- LOAD DATA FROM BACKEND ----------
async function loadRenewalData() {
  const url = `${API}/renewals/${renewalType}`;
  const res = await fetch(url);
  renewalRaw = await res.json();
}

// ---------- APPLY FILTERS ----------
async function applyRenewalFilters() {
  const params = new URLSearchParams({
    partner: filterPartner.value,
    dealer: filterDealer.value,
    insCo: filterInsCo.value,
    from: filterFrom.value,
    to: filterTo.value
  });

  const url = `${API}/renewals/${renewalType}?` + params.toString();
  const res = await fetch(url);
  renewalRaw = await res.json();
  renderRenewalRows(renewalRaw);
}

// ---------- RENDER TABLE ----------
function renderRenewalTable() {
  const head = document.getElementById("renewalHead");
  head.innerHTML = "";
  RHEAD[renewalType].forEach(h => {
    head.innerHTML += `<th>${h}</th>`;
  });
  renderRenewalRows(renewalRaw);
}

function renderRenewalRows(arr) {
  const body = document.getElementById("renewalBody");
  body.innerHTML = "";

  arr.forEach(r => {
    const tr = document.createElement("tr");
    if (renewalType === "gic") {
      tr.innerHTML = `
        <td>${r.customerName}</td>
        <td>${r.policyNo}</td>
        <td>${r.vehicleNo}</td>
        <td>${r.vehicleName}</td>
        <td>${r.insuranceYear}</td>
        <td>${(r.policyIssueDate||"").slice(0,10)}</td>
        <td>${(r.policyEndDate||"").slice(0,10)}</td>
        <td>${r.premium}</td>
        <td>${r.net}</td>
        <td>${r.dealer}</td>
        <td>${r.insuranceCompany}</td>
      `;
    }
    else if (renewalType === "lic") {
      tr.innerHTML = `
        <td>${r.customerName}</td>
        <td>${r.policyNo}</td>
        <td>${r.plan}</td>
        <td>${(r.policyIssueDate||"").slice(0,10)}</td>
        <td>${(r.policyEndDate||"").slice(0,10)}</td>
        <td>${r.premium}</td>
        <td>${r.net}</td>
        <td>${r.dealer}</td>
        <td>${r.insuranceCompany}</td>
      `;
    }
    else if (renewalType === "health") {
      tr.innerHTML = `
        <td>${r.customerName}</td>
        <td>${r.policyNo}</td>
        <td>${r.plan}</td>
        <td>${(r.policyIssueDate||"").slice(0,10)}</td>
        <td>${(r.policyEndDate||"").slice(0,10)}</td>
        <td>${r.premium}</td>
        <td>${r.net}</td>
        <td>${r.dealer}</td>
        <td>${r.insuranceCompany}</td>
      `;
    }
    else if (renewalType === "nonmotor") {
      tr.innerHTML = `
        <td>${r.customerName}</td>
        <td>${r.policyNo}</td>
        <td>${r.product}</td>
        <td>${(r.policyIssueDate||"").slice(0,10)}</td>
        <td>${(r.policyEndDate||"").slice(0,10)}</td>
        <td>${r.premium}</td>
        <td>${r.net}</td>
        <td>${r.dealer}</td>
        <td>${r.insuranceCompany}</td>
      `;
    }

    body.appendChild(tr);
  });
}

// ---------- SEARCH ----------
function searchRenewalTable() {
  const q = renewalSearch.value.toLowerCase();
  const trs = document.querySelectorAll("#renewalBody tr");

  trs.forEach(tr => {
    tr.style.display = tr.innerText.toLowerCase().includes(q) ? "" : "none";
  });
}

// ---------- EXPORT ----------
function exportRenewalCSV() {
  const headers = RHEAD[renewalType];
  let csv = headers.join(",") + "\n";

  document.querySelectorAll("#renewalBody tr").forEach(tr => {
    const row = Array.from(tr.children).map(td => `"${td.innerText}"`).join(",");
    csv += row + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${renewalType}_renewals_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}
