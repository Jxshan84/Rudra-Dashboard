const BACKEND = "https://nexora-dashboard-klgw.onrender.com";

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "";
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? "";
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function fillSelect(id, items, placeholder) {
  const select = document.getElementById(id);
  if (!select) return;

  const oldValue = select.value;
  select.innerHTML = `<option value="">${placeholder}</option>`;

  items.forEach(item => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name || item.id;
    select.appendChild(option);
  });

  if (oldValue) select.value = oldValue;
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".page").forEach(page => {
      page.classList.remove("active");
    });

    const page = document.getElementById(button.dataset.page);
    if (page) page.classList.add("active");
  });
});

window.addEventListener("load", async () => {
  setTimeout(() => {
    const loader = document.getElementById("loader");
    if (loader) loader.style.display = "none";
  }, 2600);

  await loadDashboard();
  const logged = await loadUser();
  if (!logged) return;

  await loadGuilds();

  setInterval(loadDashboard, 5000);
});

async function loadDashboard() {
  try {
    const res = await fetch(`${BACKEND}/api/dashboard/stats`);
    const data = await res.json();
    const bot = data.bot || {};

    setText("status", bot.status === "Online" ? "🟢 Online" : "🔴 Offline");
    setText("ping", `${bot.ping || 0} ms`);
    setText("servers", bot.servers || 0);
    setText("users", bot.users || 0);
    setText("commands", bot.commands || 0);
    setText("ram", `${bot.ram || 0} MB`);
    setText("node", bot.node || "Unknown");
    setText("database", "🟢 Connected");

    setText("ownerServers", bot.servers || 0);
    setText("ownerBotStatus", bot.status || "Offline");
  } catch (err) {
    setText("status", "🔴 Offline");
    setText("database", "🔴 Error");
  }
}

async function loadUser() {
  try {
    const res = await fetch(`${BACKEND}/api/user`, {
      credentials: "include"
    });

    if (res.status === 401) {
      window.location.href = `${BACKEND}/auth/discord`;
      return false;
    }

    const user = await res.json();

    setText("username", user.username || "User");

    const avatar = document.getElementById("avatar");
    if (avatar && user.avatar) {
      avatar.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
    }

    if (user.owner) {
      document.querySelectorAll(".owner-only").forEach(btn => {
        btn.style.display = "block";
      });

      await loadOwnerServers();
    }

    return true;
  } catch (err) {
    return false;
  }
}

async function loadGuilds() {
  try {
    const res = await fetch(`${BACKEND}/api/guilds`, {
      credentials: "include"
    });

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

    let saved = localStorage.getItem("selectedGuild");

    if (!saved || !guilds.some(g => g.id === saved)) {
      saved = guilds[0].id;
      localStorage.setItem("selectedGuild", saved);
    }

    select.value = saved;

    await loadGuildChannels(saved);
    await loadGuildSettings(saved);
  } catch (err) {
    console.log("Guild load error", err);
  }
}

async function loadGuildChannels(guildId) {
  if (!guildId) return;

  try {
    const res = await fetch(`${BACKEND}/api/guild/${guildId}/channels`);
    const data = await res.json();

    if (!data.success) return;

    fillSelect("welcomeChannel", data.channels, "Select Welcome Channel");
    fillSelect("leaveChannel", data.channels, "Select Leave Channel");
    fillSelect("modLogChannel", data.channels, "Select Mod Log Channel");
    fillSelect("ticketCategory", data.channels, "Select Ticket Channel");
  } catch (err) {
    console.log("Channel load error", err);
  }
}

async function loadGuildSettings(guildId) {
  if (!guildId) return;

  try {
    const res = await fetch(`${BACKEND}/api/guild/${guildId}`);
    const data = await res.json();

    if (!data.success) return;

    const s = data.settings || {};

    setValue("welcomeChannel", s.welcomeChannel || "");
    setValue("leaveChannel", s.leaveChannel || "");
    setValue("modLogChannel", s.modLogChannel || "");
    setValue("ticketCategory", s.ticketCategory || "");
    setValue("autoRole", s.autoRole || "");
    setValue("verifyRole", s.verifyRole || "");
    setValue("antiLink", String(s.antiLink || false));
    setValue("antiBot", String(s.antiBot || false));
  } catch (err) {
    console.log("Settings load error", err);
  }
}

async function saveSettings() {
  const guildId = localStorage.getItem("selectedGuild");

  if (!guildId) {
    alert("Select server first.");
    return;
  }

  const body = {
    welcomeChannel: getValue("welcomeChannel"),
    leaveChannel: getValue("leaveChannel"),
    modLogChannel: getValue("modLogChannel"),
    ticketCategory: getValue("ticketCategory"),
    autoRole: getValue("autoRole"),
    verifyRole: getValue("verifyRole"),
    antiLink: getValue("antiLink") === "true",
    antiBot: getValue("antiBot") === "true"
  };

  try {
    const res = await fetch(`${BACKEND}/api/guild/${guildId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    alert(data.success ? "✅ Settings saved." : "❌ Save failed.");
  } catch (err) {
    alert("❌ Save error.");
  }
}

async function loadOwnerServers() {
  try {
    const res = await fetch(`${BACKEND}/api/owner/servers`, {
      credentials: "include"
    });

    const data = await res.json();

    if (!data.success) return;

    setText("ownerServers", data.total || 0);

    const list = document.getElementById("ownerServerList");
    if (!list) return;

    list.innerHTML = "";

    data.guilds.forEach(guild => {
      const div = document.createElement("div");
      div.className = "server-item";

      div.innerHTML = `
        <h3>${guild.name}</h3>
        <p><b>ID:</b> ${guild.id}</p>
        <p><b>Members:</b> ${guild.members}</p>
        <p><b>Owner ID:</b> ${guild.ownerId}</p>
      `;

      list.appendChild(div);
    });
  } catch (err) {
    console.log("Owner server load error", err);
  }
}

document.addEventListener("change", e => {
  if (e.target.id === "serverSelect") {
    localStorage.setItem("selectedGuild", e.target.value);
    loadGuildChannels(e.target.value);
    loadGuildSettings(e.target.value);
  }
});

document.addEventListener("click", e => {
  if (e.target.id === "saveSettings") {
    saveSettings();
  }
});

console.log("✅ RUDRA Dashboard Loaded");