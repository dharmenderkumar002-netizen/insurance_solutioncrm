// Detect if running on Vercel or localhost
const API = window.location.hostname === "localhost" 
  ? "http://localhost:3003/api" 
  : "https://crm-backend.onrender.com/api"; // Change to your Render backend URL

let captchaText = "";

function generateCaptcha() {
    const canvas = document.getElementById("captcha");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    captchaText = Math.random().toString(36).substring(2, 8);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#024873";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Add some distortion
    for (let i = 0; i < captchaText.length; i++) {
        const char = captchaText[i];
        const x = 25 + i * 20;
        const y = canvas.height / 2 + (Math.random() - 0.5) * 10;
        const angle = (Math.random() - 0.5) * 0.5;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillText(char, 0, 0);
        ctx.restore();
    }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    requireLogin();
    initInactivityTimer();

    // Specific logic for login page
    if (window.location.pathname.endsWith("login.html")) {
        generateCaptcha();
        const reloadButton = document.getElementById("reload-captcha");
        if (reloadButton) {
            reloadButton.addEventListener("click", generateCaptcha);
        }

        const loginForm = document.getElementById("loginForm");
        if (loginForm) {
            loginForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                login();
            });
        }
    }
});


// =============== LOGIN ==================
async function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const captchaInput = document.getElementById("captcha-input").value.trim();

    if (!email || !password) {
        alert("Please enter email & password");
        return;
    }

    if (!captchaInput) {
        alert("Please enter the captcha");
        return;
    }

    if (captchaInput.toLowerCase() !== captchaText.toLowerCase()) {
        alert("Invalid captcha");
        generateCaptcha();
        return;
    }

    try {
        const res = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.status !== 200) {
            alert(data.message);
            generateCaptcha();
            return;
        }

        // Save token & user
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("user", JSON.stringify(data.user));

        window.location.href = "/assets/pages/layout.html";

    } catch (err) {
        alert("Server error");
        console.log(err);
        generateCaptcha();
    }
}



// =============== REGISTER ==================
async function registerUser() {
    const name = document.getElementById("name").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!name || !mobile || !email || !password) {
        alert("Please fill all required fields");
        return;
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
        alert("Invalid mobile number");
        return;
    }

    try {
        const res = await fetch(`${API}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, mobile, email, password })
        });

        const data = await res.json();

        if (res.status !== 201) {
            alert(data.message);
            return;
        }

        alert("Registration successful! You can now login.");
        window.location.href = "login.html";

    } catch (err) {
        alert("Server error");
        console.log(err);
    }
}

// =============== LOGOUT ==================
function logout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = "/assets/pages/login.html";
}


// =============== AUTO LOGOUT IF NOT LOGGED IN ===============
function requireLogin() {
    // Do not require login on login and register pages
    if (window.location.pathname.endsWith("login.html") || window.location.pathname.endsWith("register.html")) {
        return;
    }
    const token = sessionStorage.getItem("token");
    if (!token) {
        // If inside an iframe, redirect the top-level window
        if (window.self !== window.top) {
            window.top.location.href = "/assets/pages/login.html";
        } else {
            // Otherwise, redirect the current window
            window.location.href = "/assets/pages/login.html";
        }
    }
}

// =============== INACTIVITY TIMEOUT ==================
let inactivityTimer;

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(logout, 10 * 60 * 1000); // 10 minutes
}

function initInactivityTimer() {
    // Don't start the timer on the login page
    if (window.location.pathname.endsWith("login.html") || window.location.pathname.endsWith("register.html")) {
        return;
    }
    
    // Initial setup
    resetInactivityTimer();

    // Reset timer on user activity
    document.addEventListener("mousemove", resetInactivityTimer);
    document.addEventListener("mousedown", resetInactivityTimer);
    document.addEventListener("keypress", resetInactivityTimer);
    document.addEventListener("touchmove", resetInactivityTimer);
    document.addEventListener("scroll", resetInactivityTimer);
}