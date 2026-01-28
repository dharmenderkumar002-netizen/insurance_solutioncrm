// track.js - shared logic for all Track pages
const API = "http://localhost:4000/api";

let currentTrackType = "all";
let rawData = []; // loaded dataset

// Common table headers per type
const HEADERS = {
  all: ["ServiceType","Customer","PolicyNo","Vehicle/Plan","InsuranceYear","IssueDate","Premium","Net","Partner","Dealer","InsCo"],
  gic: ["VehicleNo","VehicleName","InsuranceYear","PolicyIssueDate","PolicyNo","Customer","Premium","Net","Partner","Dealer","InsCo"],
  lic: ["Customer","Plan","InsuranceYear","PolicyIssueDate","PolicyNo","Premium","Net","Dealer"],
  health: ["Customer","Plan","InsuranceYear","PolicyIssueDate","PolicyNo","Premium","Net","Dealer","InsCo"],
  nonmotor: ["Customer","Product","InsuranceYear","PolicyIssueDate","PolicyNo","Premium","Net","Dealer","InsCo"]
};

async function applyTrackFilters() {
  const q = new URLSearchParams({
    partner: filterPartner.value,
    insCo: filterInsCo.value,
    dealer: filterDealer.value,
    from: filterFrom.value,
    to: filterTo.value,
    search: globalSearch.value
  });

  const res = await fetch(`${API}/track/${currentTrackType}?` + q.toString());
  rawData = await res.json();

  renderRows(rawData);
}

// Load partners/dealers/insco for filters (uses backend master/partner)
async function loadFilterMasters() {
  try {
    const pRes = await fetch(`${API}/master/partner`);
    const partners = await pRes.json();
    const partnerSel = document.getElementById("filterPartner");
    if (partnerSel) {
      partnerSel.innerHTML = "<option value=''>All</option>";
      partners.forEach(p => partnerSel.innerHTML += `<option value="${p._id}">${p.name}</option>`);
    }
  } catch (err) {
    console.log("partner load error", err);
  }

  // insurance co and dealer can be loaded from static demo arrays now
  const demoIns = ["--All--","HDFC ERGO","ICICI Lombard","Star Health","Max Bupa"];
  const insSel = document.getElementById("filterInsCo");
  if (insSel) {
    insSel.innerHTML = "<option value=''>All</option>";
    demoIns.slice(1).forEach(i => insSel.innerHTML += `<option value="${i}">${i}</option>`);
  }

  const dealerSel = document.getElementById("filterDealer");
  if (dealerSel) {
    dealerSel.innerHTML = "<option value=''>All</option>";
    // demo dealers
    const dealers = ["Dealer A","Dealer B","Dealer C"];
    dealers.forEach(d => dealerSel.innerHTML += `<option value="${d}">${d}</option>`);
  }
}

// Sample data (you will replace with server data later)
function loadSampleData() {
  // small set combining types
  rawData = [
    { type:"GIC", customer:"Nishika Singh", policyNo:"GIC-TEST-001", vehicle:"DL1AB1234", vehicleName:"Honda Activa", year:"2025", issueDate:"2025-01-20", premium:5000, net:4800, partner:"Sample Partner", dealer:"Dealer A", insCo:"HDFC ERGO" },
    { type:"LIC", customer:"Rahul Kumar", policyNo:"LIC-001", plan:"LIC Plan A", year:"2024", issueDate:"2024-11-10", premium:12000, net:11800, partner:"Sample Partner", dealer:"Dealer B", insCo:"LIC" },
    { type:"HEALTH", customer:"Anita Rao", policyNo:"HLTH-123", plan:"Family Plan", year:"2025", issueDate:"2025-02-05", premium:15000, net:14900, partner:"Another Partner", dealer:"Dealer C", insCo:"Star Health" },
    { type:"NONMOTOR", customer:"Vikas Sharma", policyNo:"NM-900", product:"Fire", year:"2025", issueDate:"2025-03-01", premium:8000, net:7850, partner:"Sample Partner", dealer:"Dealer A", insCo:"ICICI Lombard" }
  ];
}

// Apply current filters and re-render
function applyTrackFilters() {
  const from = document.getElementById("filterFrom")?.value;
  const to = document.getElementById("filterTo")?.value;
  const partner = document.getElementById("filterPartner")?.value;
  const insCo = document.getElementById("filterInsCo")?.value;
  const dealer = document.getElementById("filterDealer")?.value;

  let filtered = rawData.slice();

  if (currentTrackType !== "all") filtered = filtered.filter(r => r.type.toLowerCase() === currentTrackType);

  if (partner) filtered = filtered.filter(r => r.partner === getPartnerNameById(partner));

  if (insCo) filtered = filtered.filter(r => r.insCo === insCo);
  if (dealer) filtered = filtered.filter(r => r.dealer === dealer);

  if (from) filtered = filtered.filter(r => r.issueDate >= from);
  if (to) filtered = filtered.filter(r => r.issueDate <= to);

  renderRows(filtered);
}

// helper to map partner id -> name (if backend returns objects)
function getPartnerNameById(id) {
  // We don't have a global partner map here; if needed, fetch and map on init.
  // For sample, seed maps sample id to Sample Partner if any.
  // Fallback: return empty so filter won't remove.
  return "Sample Partner";
}

// Render table headers + all rows
function renderTable() {
  const headRow = document.getElementById("trackHead");
  headRow.innerHTML = "";
  const headers = HEADERS[currentTrackType] || HEADERS["all"];
  headers.forEach(h => {
    const th = document.createElement("th");
    th.innerText = h;
    headRow.appendChild(th);
  });

  // build rows based on current type
  let rows = rawData.slice();
  if (currentTrackType !== "all") rows = rows.filter(r => r.type.toLowerCase() === currentTrackType);

  renderRows(rows);
}

// Render provided rows array
function renderRows(rows) {
  const tbody = document.getElementById("trackBody");
  tbody.innerHTML = "";

  rows.forEach(r => {
    const tr = document.createElement("tr");

    if (currentTrackType === "gic") {
      tr.innerHTML = `<td>${escapeHtml(r.vehicle)}</td>
                      <td>${escapeHtml(r.vehicleName || "")}</td>
                      <td>${escapeHtml(r.year || "")}</td>
                      <td>${escapeHtml(r.issueDate || "")}</td>
                      <td>${escapeHtml(r.policyNo || "")}</td>
                      <td>${escapeHtml(r.customer || "")}</td>
                      <td>${r.premium || ""}</td>
                      <td>${r.net || ""}</td>
                      <td>${escapeHtml(r.partner || "")}</td>
                      <td>${escapeHtml(r.dealer || "")}</td>
                      <td>${escapeHtml(r.insCo || "")}</td>`;
    } else if (currentTrackType === "lic") {
      tr.innerHTML = `<td>${escapeHtml(r.customer || "")}</td>
                      <td>${escapeHtml(r.plan || r.product || "")}</td>
                      <td>${escapeHtml(r.year || "")}</td>
                      <td>${escapeHtml(r.issueDate || "")}</td>
                      <td>${r.premium || ""}</td>
                      <td>${r.net || ""}</td>
                      <td><button>Edit> </button></td>
                      <td><button>Del</button></td>`;
    } else if (currentTrackType === "health") {
      tr.innerHTML = `<td>${escapeHtml(r.customer || "")}</td>
                      <td>${escapeHtml(r.plan || "")}</td>
                      <td>${escapeHtml(r.year || "")}</td>
                      <td>${escapeHtml(r.issueDate || "")}</td>
                      <td>${r.premium || ""}</td>
                      <td>${r.net || ""}</td>
                      <td>${escapeHtml(r.dealer || "")}</td>
                      <td>${escapeHtml(r.insCo || "")}</td>`;
    } else if (currentTrackType === "nonmotor") {
      tr.innerHTML = `<td>${escapeHtml(r.customer || "")}</td>
                      <td>${escapeHtml(r.product || "")}</td>
                      <td>${escapeHtml(r.year || "")}</td>
                      <td>${escapeHtml(r.issueDate || "")}</td>
                      <td>${r.premium || ""}</td>
                      <td>${r.net || ""}</td>
                      <td>${escapeHtml(r.dealer || "")}</td>
                      <td>${escapeHtml(r.insCo || "")}</td>`;
    } else { // all
      tr.innerHTML = `<td>${escapeHtml(r.type)}</td>
                      <td>${escapeHtml(r.customer || "")}</td>
                      <td>${escapeHtml(r.policyNo || "")}</td>
                      <td>${escapeHtml(r.vehicle || r.plan || r.product || "")}</td>
                      <td>${escapeHtml(r.year || "")}</td>
                      <td>${escapeHtml(r.issueDate || "")}</td>
                      <td>${r.premium || ""}</td>
                      <td>${r.net || ""}</td>
                      <td>${escapeHtml(r.partner || "")}</td>
                      <td>${escapeHtml(r.dealer || "")}</td>
                      <td>${escapeHtml(r.insCo || "")}</td>`;
    }

    tbody.appendChild(tr);
  });
}

// Client side search inside visible table
function filterTableSearch() {
  const q = (document.getElementById("globalSearch")?.value || "").toLowerCase();
  const tbody = document.getElementById("trackBody");
  Array.from(tbody.querySelectorAll("tr")).forEach(tr=>{
    const text = tr.innerText.toLowerCase();
    tr.style.display = text.includes(q) ? "" : "none";
  });
}

// Export visible rows to CSV
function exportVisibleToCSV() {
  const headers = Array.from(document.querySelectorAll("#trackHead th")).map(th => th.innerText);
  const rows = [];
  const tbody = document.getElementById("trackBody");
  Array.from(tbody.querySelectorAll("tr")).forEach(tr => {
    if (tr.style.display === "none") return; // skip hidden
    const cols = Array.from(tr.children).map(td => td.innerText.replace(/\n/g, " ").trim());
    rows.push(cols);
  });

  // build CSV
  let csv = headers.join(",") + "\n";
  rows.forEach(r => { csv += r.map(cell => `"${(cell||"").replace(/"/g,'""')}"`).join(",") + "\n"; });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const name = `${currentTrackType || "track"}_export_${new Date().toISOString().slice(0,10)}.csv`;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// simple HTML escape
function escapeHtml(s) {
  if (!s && s !== 0) return "";
  return String(s).replace(/[&<>"'`=\/]/g, function (c) {
    return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;","/":"&#x2F;","`":"&#x60;","=":"&#x3D;"}[c];
  });
}
