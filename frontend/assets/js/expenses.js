const API = "http://localhost:4000/api";

// -------------- DEALER EXPENSES ----------------
async function initDealerExpenses() {
  // load dealer dropdown (demo)
  const sel = document.getElementById("exDealer");
  ["Dealer A","Dealer B","Dealer C"].forEach(d => {
    sel.innerHTML += `<option>${d}</option>`;
  });

  loadDealerExpenses();
}

async function saveDealerExpense() {
  const payload = {
    dealer: exDealer.value,
    expenseType: exType.value,
    amount: exAmount.value,
    remarks: exRemarks.value,
    date: new Date()
  };

  await fetch(`${API}/expenses/dealer/add`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify(payload)
  });

  alert("Saved!");
  loadDealerExpenses();
}

async function loadDealerExpenses() {
  const res = await fetch(`${API}/expenses/dealer/list`);
  const data = await res.json();

  const tbody = document.getElementById("dealerBody");
  tbody.innerHTML = "";

  data.forEach(d => {
    tbody.innerHTML += `
      <tr>
        <td>${d.dealer}</td>
        <td>${d.expenseType}</td>
        <td>${d.amount}</td>
        <td>${d.remarks}</td>
        <td>${(d.date||"").slice(0,10)}</td>
      </tr>
    `;
  });
}

// -------------- PARTNER EXPENSES ----------------
async function initPartnerExpenses() {
  const res = await fetch(`${API}/master/partner`);
  const list = await res.json();

  const sel = document.getElementById("pPartner");
  list.forEach(p => sel.innerHTML += `<option value="${p._id}">${p.name}</option>`);

  loadPartnerExpenses();
}

async function savePartnerExpense() {
  const payload = {
    partnerId: pPartner.value,
    amount: pAmount.value,
    remarks: pRemarks.value,
    date: new Date()
  };

  await fetch(`${API}/expenses/partner/add`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify(payload)
  });

  alert("Saved!");
  loadPartnerExpenses();
}

async function loadPartnerExpenses() {
  const res = await fetch(`${API}/expenses/partner/list`);
  const data = await res.json();

  const tbody = document.getElementById("partnerBody");
  tbody.innerHTML = "";

  data.forEach(d => {
    tbody.innerHTML += `
      <tr>
        <td>${d.partnerId}</td>
        <td>${d.amount}</td>
        <td>${d.remarks}</td>
        <td>${(d.date||"").slice(0,10)}</td>
      </tr>
    `;
  });
}

// -------------- EXPENSE SETTINGS ----------------
let rows = [];

async function initExpenseSetting(type) {
  window.expenseType = type;
}

function addSettingRow() {
  const table = document.getElementById("settingBody");
  const index = rows.length + 1;

  rows.push({ sno:index });

  table.innerHTML += `
    <tr>
      <td>${index}</td>
      <td><input class="t" id="cmp${index}"></td>
      <td><input class="t" id="prod${index}"></td>
      <td><input class="t" id="cls${index}"></td>
      <td><input class="t" id="fuel${index}"></td>
      <td><input class="t" id="cov${index}"></td>
      <td>
        <select id="pt${index}">
          <option>on OD</option>
          <option>on NET</option>
        </select>
      </td>
      <td><input type="number" id="pv${index}" class="t"></td>
    </tr>
  `;
}

async function saveExpenseSetting() {
  const rws = rows.map(r => ({
    sno: r.sno,
    company: document.getElementById(`cmp${r.sno}`).value,
    vehicleProduct: document.getElementById(`prod${r.sno}`).value,
    vehicleClass: document.getElementById(`cls${r.sno}`).value,
    fuelType: document.getElementById(`fuel${r.sno}`).value,
    coverage: document.getElementById(`cov${r.sno}`).value,
    payoutType: document.getElementById(`pt${r.sno}`).value,
    payoutValue: document.getElementById(`pv${r.sno}`).value
  }));

  const payload = {
    type: window.expenseType,
    dealer: document.getElementById("setDealer").value,
    status: document.getElementById("setStatus").value,
    rows: rws
  };

  await fetch(`${API}/expenses/save-settings`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify(payload)
  });

  alert("Settings Saved Successfully!");
}
