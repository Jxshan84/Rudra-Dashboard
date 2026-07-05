const API = "https://YOUR-RENDER-URL.onrender.com";

async function loadStatus() {
  try {
    const res = await fetch(`${API}/health`);
    const data = await res.json();

    if (document.getElementById("status")) {
      document.getElementById("status").textContent = data.status || "Online";
    }

    if (document.getElementById("ping")) {
      document.getElementById("ping").textContent =
        (data.ping ?? "--") + " ms";
    }

    if (document.getElementById("servers")) {
      document.getElementById("servers").textContent =
        data.servers ?? "--";
    }

    if (document.getElementById("users")) {
      document.getElementById("users").textContent =
        data.users ?? "--";
    }

    if (document.getElementById("serverCount")) {
      document.getElementById("serverCount").textContent =
        data.servers ?? "--";
    }

    if (document.getElementById("memberCount")) {
      document.getElementById("memberCount").textContent =
        data.users ?? "--";
    }

  } catch (err) {
    console.error("API Error:", err);

    if (document.getElementById("status")) {
      document.getElementById("status").textContent = "Offline";
    }
  }
}

loadStatus();
setInterval(loadStatus, 10000);