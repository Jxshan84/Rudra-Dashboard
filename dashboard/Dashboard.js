const API = "https://nexora-dashboard-klgw.onrender.com/health";

async function loadDashboard() {
  try {
    const res = await fetch(API);
    const data = await res.json();

    document.getElementById("servers").textContent = data.servers;
    document.getElementById("users").textContent = data.users;
    document.getElementById("ping").textContent = data.ping + " ms";
    document.getElementById("status").textContent = data.status;

  } catch (err) {
    console.error(err);

    document.getElementById("status").textContent = "Offline";
  }
}

loadDashboard();
setInterval(loadDashboard, 5000);