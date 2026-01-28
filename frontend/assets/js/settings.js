const API = "http://localhost:4000/api";

async function initUsersPage() {
  loadPendingUsers();
  loadAllUsers();
}

async function registerSettingsUser() {
  const name = regName.value.trim();
  const mobile = regMobile.value.trim();
  const email = regEmail.value.trim();
  const approvedBy = regApprover.value.trim() || "insgzb@gmail.com";

  if (!name || !mobile || !email) return alert("Please fill required fields");
  if (!/^[0-9]{10}$/.test(mobile)) return alert("Invalid mobile");

  const res = await fetch(`${API}/settings/register`, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ name, mobile, email, approvedBy })
  });
  const data = await res.json();
  alert(data.message || "Registered");
  loadPendingUsers();
}

async function loadPendingUsers() {
  const res = await fetch(`${API}/settings/users?status=Pending`);
  const arr = await res.json();
  const tbody = document.getElementById("pendingBody");
  tbody.innerHTML = "";
  arr.forEach(u => {
    tbody.innerHTML += `<tr>
      <td>${u.name}</td><td>${u.email}</td><td>${u.mobile||""}</td>
      <td>${(u.createdAt||"").slice(0,10)}</td>
      <td>
        <button onclick="approveUserClient('${u._id}')">Approve</button>
      </td>
    </tr>`;
  });
}

async function loadAllUsers() {
  const res = await fetch(`${API}/settings/users`);
  const arr = await res.json();
  const tbody = document.getElementById("allUsersBody");
  tbody.innerHTML = "";
  arr.forEach(u => {
    tbody.innerHTML += `<tr>
      <td>${u.name}</td><td>${u.email}</td><td>${u.mobile||""}</td>
      <td>${u.status}</td><td>${(u.createdAt||"").slice(0,10)}</td>
    </tr>`;
  });
}

async function approveUserClient(id) {
  if (!confirm("Approve this user?")) return;
  const res = await fetch(`${API}/settings/approve/${id}`, { method: "POST" });
  const data = await res.json();
  alert(data.message || "Approved");
  loadPendingUsers();
  loadAllUsers();
}

// ========== Company info ==========
async function saveCompany() {
  const payload = {
    name: compName.value,
    address: compAddress.value,
    email: compEmail.value,
    phone: compPhone.value,
    gstin: compGstin.value
  };
  await fetch(`${API}/settings/company/save`, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(payload)
  });
  alert("Saved");
}

async function loadCompanyInfo() {
  const res = await fetch(`${API}/settings/company/get`);
  const c = await res.json();
  compName.value = c.name || "";
  compAddress.value = c.address || "";
  compEmail.value = c.email || "";
  compPhone.value = c.phone || "";
  compGstin.value = c.gstin || "";
}

// ========== Change password ==========
async function changeMyPassword() {
  const cur = curPass.value;
  const nw = newPass.value;
  const cf = confPass.value;

  if (!cur || !nw || !cf) return alert("Fill all fields");
  if (nw !== cf) return alert("Passwords do not match");

  // user email from localStorage (set at login)
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user.email) return alert("User not available");

  const res = await fetch(`${API}/settings/change-password`, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ email: user.email, currentPassword: cur, newPassword: nw })
  });
  const data = await res.json();
  if (data.error) alert(data.error); else { alert(data.message || "Password changed"); logout(); }
}
