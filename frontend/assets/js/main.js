function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
}

function requireLogin() {
    const tk = localStorage.getItem("token");
    if (!tk) window.location.href = "login.html";
}
function loadUser() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const box = document.getElementById("welcomeUser");
    if (box && user?.name) {
        box.innerText = "Hello, " + user.name;
    }
}
