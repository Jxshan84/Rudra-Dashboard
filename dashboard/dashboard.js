const API = "https://nexora-dashboard-klgw.onrender.com/health";

async function loadDashboard() {
  try {
    const res = await fetch(API);
    const data = await res.json();

    document.getElementById("servers").textContent = data.servers ?? "0";
    document.getElementById("users").textContent = data.users ?? "0";
    document.getElementById("ping").textContent = (data.ping ?? "0") + " ms";
    document.getElementById("status").textContent = data.status ?? "Offline";

    document.getElementById("database").textContent = "Connected";
  } catch (err) {
    console.error("Dashboard Error:", err);

    document.getElementById("status").textContent = "Offline";
    document.getElementById("database").textContent = "Error";
  }
}

function updateUptime() {
  const start = Date.now();

  setInterval(() => {
    const sec = Math.floor((Date.now() - start) / 1000);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;

    document.getElementById("uptime").textContent = `${h}h ${m}m ${s}s`;
  }, 1000);
}

loadDashboard();
updateUptime();

setInterval(loadDashboard, 5000);