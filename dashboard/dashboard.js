const BACKEND = "https://nexora-dashboard-klgw.onrender.com";

let currentUser = null;
let currentGuild = null;
let allChannels = [];
let allRoles = [];

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

function notify(message) {
  alert(message);
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

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
  document.getElementById(pageId)?.classList.add("active");
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

window.addEventListener("load", async () => {
  startLoaderText();

  setTimeout(() => {
    const loader = document.getElementById("loader");
    if (loader) loader.style.display = "none";
  }, 3800);

  const logged = await loadUser();
  if (!logged) return;

  await loadGuilds();

  setInterval(() => {
    if (currentGuild) loadSelectedGuildStats(currentGuild);
  }, 5000);
});

function startLoaderText() {
  const loaderText = document.getElementById("loaderText");
  if (!loaderText) return;

  const messages = [
    "Initializing RUDRA...",
    "Loading Modules...",
    "Connecting Database...",
    "Connecting Discord...",
    "Starting Dashboard..."
  ];

  let index = 0;
  setInterval(() => {
    loaderText.textContent = messages[index % messages.length];
    index++;
  }, 700);
}

async function loadUser() {
  try {
    const res = await fetch(`${BACKEND}/api/user`, { credentials: "include" });

    if (res.status === 401) {
      window.location.href = `${BACKEND}/auth/discord`;
      return false;
    }

    const user = await res.json();
    currentUser = user;

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
    console.log("User load error", err);
    return false;
  }
}

async function loadGuilds() {
  try {
    const res = await fetch(`${BACKEND}/api/guilds`, { credentials: "include" });
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
    currentGuild = saved;

    await loadGuildData(saved);
  } catch (err) {
    console.log("Guild load error", err);
  }
}

async function loadGuildData(guildId) {
  if (!guildId) return;

  currentGuild = guildId;

  await loadSelectedGuildStats(guildId);
  await loadGuildChannels(guildId);
  await loadGuildRoles(guildId);
  await loadGuildSettings(guildId);
  await loadReactionRoles(guildId);
}

async function loadSelectedGuildStats(guildId) {
  try {
    const res = await fetch(`${BACKEND}/api/guild/${guildId}/stats`);
    const data = await res.json();

    if (!data.success) return;

    const g = data.guild || {};
    const s = data.settings || {};

    setText("status", "🟢 Selected");
    setText("ping", "Live");
    setText("servers", g.name || "Server");
    setText("users", g.members || 0);
    setText("commands", g.roles || 0);
    setText("ram", g.channels || 0);
    setText("node", s.isPremium ? "Premium" : "Free");
    setText("database", "🟢 Saved");

    setText("ownerBotStatus", "Online");
  } catch (err) {
    console.log("Selected guild stats error", err);
    setText("status", "🔴 Error");
  }
}

async function loadGuildChannels(guildId) {
  try {
    const res = await fetch(`${BACKEND}/api/guild/${guildId}/channels`);
    const data = await res.json();

    if (!data.success) return;

    allChannels = data.channels || [];

    fillSelect("welcomeChannel", allChannels, "Select Welcome Channel");
    fillSelect("leaveChannel", allChannels, "Select Leave Channel");
    fillSelect("modLogChannel", allChannels, "Select Mod Log Channel");
    fillSelect("ticketCategory", allChannels, "Select Ticket Channel");
    fillSelect("rrChannel", allChannels, "Select Channel");
    fillSelect("rrExistingChannel", allChannels, "Select Channel");
  } catch (err) {
    console.log("Channel load error", err);
  }
}

async function loadGuildRoles(guildId) {
  try {
    const res = await fetch(`${BACKEND}/api/guild/${guildId}/roles`);
    const data = await res.json();

    if (!data.success) return;

    allRoles = data.roles || [];

    fillSelect("autoRole", allRoles, "Select Auto Role");
    fillSelect("verifyRole", allRoles, "Select Verification Role");
    fillSelect("rrRole", allRoles, "Select Role");
    fillSelect("rrExistingRole", allRoles, "Select Role");
  } catch (err) {
    console.log("Role load error", err);
  }
}

async function loadGuildSettings(guildId) {
  try {
    const res = await fetch(`${BACKEND}/api/guild/${guildId}`);
    const data = await res.json();

    if (!data.success) return;

    const s = data.settings || {};

    setValue("prefix", s.prefix || "/");
    setValue("welcomeChannel", s.welcomeChannel || "");
    setValue("leaveChannel", s.leaveChannel || "");
    setValue("modLogChannel", s.modLogChannel || "");
    setValue("ticketCategory", s.ticketCategory || "");
    setValue("autoRole", s.autoRole || "");
    setValue("verifyRole", s.verificationRole || s.verifyRole || "");
    setValue("antiLink", String(s.antiLink || false));
    setValue("antiBot", String(s.antiBot || false));
  } catch (err) {
    console.log("Settings load error", err);
  }
}

async function saveSettings() {
  if (!currentGuild) return notify("Select a server first.");

  const body = {
    prefix: getValue("prefix") || "/",
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
    const res = await fetch(`${BACKEND}/api/guild/${currentGuild}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    notify(data.success ? "✅ Settings Saved Successfully." : "❌ Failed to save settings.");
  } catch {
    notify("❌ Failed to connect backend.");
  }
}

function updateReactionPreview() {
  setText("previewTitle", getValue("rrTitle") || "Choose your roles");
  setText("previewDescription", getValue("rrDescription") || "React below to receive your role.");
  setText("previewEmoji", getValue("rrEmoji") || "😀");

  const role = document.getElementById("rrRole");
  if (role) setText("previewRole", role.options[role.selectedIndex]?.text || "Selected Role");
}

["rrTitle", "rrDescription", "rrEmoji"].forEach(id => {
  document.getElementById(id)?.addEventListener("input", updateReactionPreview);
});

document.getElementById("rrRole")?.addEventListener("change", updateReactionPreview);

async function createReactionRole() {
  if (!currentGuild) return notify("Select a server first.");

  const body = {
    guildId: currentGuild,
    channelId: getValue("rrChannel"),
    title: getValue("rrTitle"),
    description: getValue("rrDescription"),
    color: "#ff0000",
    footer: "Powered by RUDRA",
    type: getValue("rrType") || "normal",
    roles: [
      {
        emoji: getValue("rrEmoji"),
        roleId: getValue("rrRole"),
        label: "",
        description: ""
      }
    ],
    createdBy: currentUser?.id
  };

  if (!body.channelId || !body.roles[0].emoji || !body.roles[0].roleId) {
    return notify("Channel, role and emoji required.");
  }

  try {
    const res = await fetch(`${BACKEND}/api/reactionrole/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (data.success) {
      notify("✅ Reaction Role Created.");
      loadReactionRoles(currentGuild);
    } else {
      notify(data.message || "Failed.");
    }
  } catch {
    notify("Backend Error.");
  }
}

async function createExistingReactionRole() {
  if (!currentGuild) return notify("Select a server first.");

  const body = {
    guildId: currentGuild,
    channelId: getValue("rrExistingChannel"),
    messageId: getValue("rrExistingMessageId"),
    roles: [
      {
        emoji: getValue("rrExistingEmoji"),
        roleId: getValue("rrExistingRole"),
        label: "",
        description: ""
      }
    ],
    createdBy: currentUser?.id
  };

  if (!body.channelId || !body.messageId || !body.roles[0].emoji || !body.roles[0].roleId) {
    return notify("Channel, message ID, role and emoji required.");
  }

  try {
    const res = await fetch(`${BACKEND}/api/reactionrole/existing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (data.success) {
      notify("✅ Added Successfully.");
      loadReactionRoles(currentGuild);
    } else {
      notify(data.message || "Failed.");
    }
  } catch {
    notify("Backend Error.");
  }
}

async function loadReactionRoles(guildId) {
  try {
    const res = await fetch(`${BACKEND}/api/reactionrole/${guildId}`);
    const data = await res.json();

    const list = document.getElementById("reactionRoleList");
    if (!list) return;

    list.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = `<div class="server-item">No Reaction Roles Found</div>`;
      return;
    }

    data.forEach(rr => {
      const roleLines = (rr.roles || [])
        .map(r => `<p><b>${r.emoji}</b> Role ID: ${r.roleId}</p>`)
        .join("");

      const div = document.createElement("div");
      div.className = "server-item";

      div.innerHTML = `
        <h3>${rr.title || "Reaction Role"}</h3>
        ${roleLines}
        <p><b>Message ID:</b> ${rr.messageId}</p>
        <button onclick="deleteReactionRole('${rr._id}')">🗑 Delete</button>
      `;

      list.appendChild(div);
    });
  } catch (err) {
    console.log(err);
  }
}

async function deleteReactionRole(id) {
  if (!confirm("Delete this Reaction Role?")) return;

  try {
    await fetch(`${BACKEND}/api/reactionrole/${id}`, { method: "DELETE" });
    notify("✅ Deleted");
    loadReactionRoles(currentGuild);
  } catch {
    notify("❌ Failed");
  }
}

window.deleteReactionRole = deleteReactionRole;

async function loadOwnerServers() {
  try {
    const res = await fetch(`${BACKEND}/api/owner/servers`, { credentials: "include" });
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
        <p>ID: ${guild.id}</p>
        <p>Members: ${guild.members}</p>
        <p>Owner: ${guild.ownerId}</p>
      `;

      list.appendChild(div);
    });
  } catch (err) {
    console.log(err);
  }
}

document.addEventListener("change", e => {
  if (e.target.id === "serverSelect") {
    currentGuild = e.target.value;
    localStorage.setItem("selectedGuild", currentGuild);
    loadGuildData(currentGuild);
  }
});

document.addEventListener("click", e => {
  switch (e.target.id) {
    case "saveSettings":
      saveSettings();
      break;
    case "createRR":
      createReactionRole();
      break;
    case "createExistingRR":
      createExistingReactionRole();
      break;
  }
});

console.log("✅ RUDRA Dashboard Loaded");