const API = "http://localhost:4000/api";
let masterType = "";

// INIT MASTER PAGE
async function initMaster(type) {
  masterType = type;
  loadMasterList();
}

// SAVE MASTER
async function saveMaster() {
  const payload = {
    type: masterType,
    name: mName.value,
    phone: mPhone.value || "",
    email: mEmail.value || "",
    inOut: mInOut.value || "",
    status: mStatus.value
  };

  await fetch(`${API}/master/add`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify(payload)
  });

  alert("Saved Successfully");
  loadMasterList();
}

// LOAD ALL
async function loadMasterList() {
  const res = await fetch(`${API}/master/list?type=${masterType}`);
  const list = await res.json();

  const body = document.getElementById("masterBody");
  if (!body) return;

  body.innerHTML = "";

  list.forEach(item => {
    body.innerHTML += `
      <tr>
        <td>${item.name}</td>
        <td>${item.phone || ""}</td>
        <td>${item.email || ""}</td>
        <td>${item.inOut || ""}</td>
        <td>${item.status}</td>
        <td>${(item.date || "").slice(0,10)}</td>
        <td><button onclick="editMaster('${item._id}')">Edit</button></td>
        <td><button onclick="deleteMaster('${item._id}')">X</button></td>
      </tr>
    `;
  });
}

// DELETE
async function deleteMaster(id) {
  await fetch(`${API}/master/delete/${id}`, { method:"DELETE" });
  loadMasterList();
}

// EDIT
async function editMaster(id) {
  const newName = prompt("Enter new name:");
  if (!newName) return;

  await fetch(`${API}/master/update/${id}`, {
    method:"PUT",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ name:newName })
  });

  loadMasterList();
}
