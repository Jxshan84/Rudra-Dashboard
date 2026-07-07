const API = "/api/dashboard/stats";

async function loadDashboard() {
  try {
    const res = await fetch(API);
    const data = await res.json();

    document.getElementById("servers").textContent = data.bot?.servers ?? "0";
    document.getElementById("users").textContent = data.bot?.users ?? "0";
    document.getElementById("ping").textContent = (data.bot?.ping ?? "0") + " ms";
    document.getElementById("status").textContent = "🟢 Online";
    document.getElementById("commands").textContent = data.bot?.commands ?? "0";
    document.getElementById("database").textContent = "Connected";
  } catch (err) {
    document.getElementById("status").textContent = "🔴 Offline";
    document.getElementById("database").textContent = "Error";
  }
}

async function loadUser() {
  try {
    const res = await fetch("/api/user", { credentials: "include" });
    if (res.status === 401) {
      window.location.href = "/auth/discord";
      return;
    }

    const user = await res.json();

    if (user.loggedIn) {
      document.querySelector(".profile span").textContent = user.username;

      if (user.avatar) {
        document.querySelector(".profile img").src =
          `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
      }
    }
  } catch (err) {
    console.error("User Error:", err);
  }
}

async function loadServers() {
  try {
    const res = await fetch("/api/guilds", { credentials: "include" });
    const guilds = await res.json();

    const select = document.getElementById("serverSelect");
    if (!select) return;

    select.innerHTML = "";

    if (!Array.isArray(guilds) || guilds.length === 0) {
      select.innerHTML = `<option value="">No servers found</option>`;
      return;
    }

    guilds.forEach(guild => {
      const option = document.createElement("option");
      option.value = guild.id;
      option.textContent = guild.name;
      select.appendChild(option);
    });

    const saved = localStorage.getItem("selectedGuild");

    if (saved) {
      select.value = saved;
    } else {
      localStorage.setItem("selectedGuild", select.value);
    }

    loadGuildSettings(select.value);

  } catch (err) {
    console.error("Server Load Error:", err);
  }
}

async function loadGuildSettings(guildId) {
  if (!guildId) return;

  try {
    const res = await fetch(`/api/guild/${guildId}`);
    const data = await res.json();

    if (!data.success) return;

    const s = data.settings;

    setValue("prefix", s.prefix || "/");
    setValue("welcomeChannel", s.welcomeChannel || "");
    setValue("leaveChannel", s.leaveChannel || "");
    setValue("autoRole", s.autoRole || "");
    setValue("modLogChannel", s.modLogChannel || "");
    setValue("gemsLogChannel", s.gemsLogChannel || "");
    setValue("ticketCategory", s.ticketCategory || "");

    setValue("automod", String(s.automod || false));
    setValue("antiLink", String(s.antiLink || false));
    setValue("isPremium", String(s.isPremium || false));

  } catch (err) {
    console.error("Settings Load Error:", err);
  }
}

async function saveGuildSettings() {
  const guildId = localStorage.getItem("selectedGuild");

  if (!guildId) {
    alert("Select a server first.");
    return;
  }

  const body = {
    prefix: getValue("prefix"),
    welcomeChannel: getValue("welcomeChannel"),
    leaveChannel: getValue("leaveChannel"),
    autoRole: getValue("autoRole"),
    modLogChannel: getValue("modLogChannel"),
    gemsLogChannel: getValue("gemsLogChannel"),
    ticketCategory: getValue("ticketCategory"),
    automod: getValue("automod") === "true",
    antiLink: getValue("antiLink") === "true",
    isPremium: getValue("isPremium") === "true"
  };

  try {
    const res = await fetch(`/api/guild/${guildId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (data.success) {
      alert("✅ Settings saved successfully.");
    } else {
      alert("❌ Failed to save settings.");
    }
  } catch (err) {
    alert("❌ Save error.");
  }
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function startUptime() {
  let sec = 0;

  setInterval(() => {
    sec++;

    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;

    const uptime = document.getElementById("uptime");
    if (uptime) uptime.textContent = `${h}h ${m}m ${s}s`;
  }, 1000);
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".page-section").forEach(page => {
      page.classList.remove("active-page");
    });

    const page = document.getElementById(`${button.dataset.page}-page`);
    if (page) page.classList.add("active-page");
  });
});

document.addEventListener("change", e => {
  if (e.target.id === "serverSelect") {
    localStorage.setItem("selectedGuild", e.target.value);
    loadGuildSettings(e.target.value);
  }
});

document.addEventListener("click", e => {
  if (e.target.id === "saveSettings") {
    saveGuildSettings();
  }
});

loadDashboard();
loadUser();
loadServers();
startUptime();

setInterval(loadDashboard, 5000);