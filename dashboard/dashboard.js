/* =========================
RUDRA DASHBOARD JS
PART 1
========================= */

const BACKEND = "https://nexora-dashboard-klgw.onrender.com";

let currentUser = null;
let currentGuild = null;

function $(id) {
    return document.getElementById(id);
}

function setText(id, value) {
    const el = $(id);

    if (el) {
        el.textContent = value ?? "";
    }
}

function setValue(id, value) {
    const el = $(id);

    if (el) {
        el.value = value ?? "";
    }
}

function getValue(id) {
    const el = $(id);

    return el ? el.value : "";
}

function notify(message) {
    alert(message);
}

function showPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove("active");

        });

    document
        .querySelectorAll(".sidebar-menu button")
        .forEach(button => {

            button.classList.remove("active");

        });

    const page = document.getElementById(pageId);

    if (page) {

        page.classList.add("active");

    }

    const activeButton = document.querySelector(
        `[data-page="${pageId}"]`
    );

    if (activeButton) {

        activeButton.classList.add("active");

    }
}

document
    .querySelectorAll("[data-page]")
    .forEach(button => {

        button.addEventListener("click", () => {

            showPage(
                button.dataset.page
            );

        });

    });

window.addEventListener(
    "load",
    async () => {

        await loadDashboard();

        const logged = await loadUser();

        if (!logged) {

            return;

        }

        await loadGuilds();

        setInterval(
            loadDashboard,
            5000
        );

    }
);
/* =========================
RUDRA DASHBOARD JS
PART 2
========================= */

async function loadDashboard() {

    try {

        const res = await fetch(
            `${BACKEND}/api/dashboard/stats`
        );

        const data = await res.json();

        const bot = data.bot || {};

        setText(
            "status",
            bot.status === "Online"
                ? "🟢 Online"
                : "🔴 Offline"
        );

        setText(
            "ping",
            `${bot.ping || 0} ms`
        );

        setText(
            "servers",
            bot.servers || 0
        );

        setText(
            "users",
            bot.users || 0
        );

        setText(
            "commands",
            bot.commands || 0
        );

        setText(
            "ram",
            `${bot.ram || 0} MB`
        );

        setText(
            "node",
            bot.node || "Unknown"
        );

        setText(
            "database",
            "🟢 Connected"
        );

        setText(
            "ownerServers",
            bot.servers || 0
        );

        setText(
            "ownerUsers",
            bot.users || 0
        );

        setText(
            "ownerBotStatus",
            bot.status || "Offline"
        );

    } catch {

        setText(
            "status",
            "🔴 Offline"
        );

        setText(
            "database",
            "🔴 Error"
        );

    }

}

async function loadUser() {

    try {

        const res = await fetch(
            `${BACKEND}/api/user`,
            {
                credentials: "include"
            }
        );

        if (
            res.status === 401
        ) {

            window.location.href =
                `${BACKEND}/auth/discord`;

            return false;

        }

        const user = await res.json();

        currentUser = user;

        setText(
            "username",
            user.username
        );

        const avatar = $("avatar");

        if (
            avatar &&
            user.avatar
        ) {

            avatar.src =
                `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;

        }

        if (user.owner) {

            document
                .querySelectorAll(
                    ".owner-only"
                )
                .forEach(
                    element => {

                        element.style.display =
                            "flex";

                    }
                );

        }

        return true;

    } catch {

        return false;

    }

}
/* =========================
RUDRA DASHBOARD JS
PART 3
========================= */

async function loadGuilds() {

    try {

        const res = await fetch(
            `${BACKEND}/api/guilds`,
            {
                credentials: "include"
            }
        );

        const guilds = await res.json();

        const select = $("serverSelect");

        if (!select) return;

        select.innerHTML = "";

        if (
            !Array.isArray(guilds) ||
            guilds.length === 0
        ) {

            select.innerHTML =
                `<option>No Servers Found</option>`;

            return;

        }

        guilds.forEach(guild => {

            const option =
                document.createElement(
                    "option"
                );

            option.value = guild.id;

            option.textContent =
                guild.name;

            select.appendChild(
                option
            );

        });

        let savedGuild =
            localStorage.getItem(
                "selectedGuild"
            );

        if (

            !savedGuild ||

            !guilds.some(
                guild =>
                    guild.id ===
                    savedGuild
            )

        ) {

            savedGuild =
                guilds[0].id;

            localStorage.setItem(
                "selectedGuild",
                savedGuild
            );

        }

        select.value =
            savedGuild;

        currentGuild =
            savedGuild;

        await loadGuildData(
            savedGuild
        );

    } catch (error) {

        console.log(
            "Guild Load Error",
            error
        );

    }

}

async function loadGuildData(
    guildId
) {

    if (!guildId) return;

    currentGuild =
        guildId;

    await Promise.all([

        loadGuildChannels(
            guildId
        ),

        loadGuildRoles(
            guildId
        ),

        loadGuildSettings(
            guildId
        )

    ]);

}

document.addEventListener(
    "change",
    event => {

        if (

            event.target.id ===
            "serverSelect"

        ) {

            currentGuild =
                event.target.value;

            localStorage.setItem(

                "selectedGuild",

                currentGuild

            );

            loadGuildData(

                currentGuild

            );

        }

    }
);
/* =========================
RUDRA DASHBOARD JS
PART 4
========================= */

async function loadGuildChannels(guildId) {

    try {

        const res = await fetch(
            `${BACKEND}/api/guild/${guildId}/channels`
        );

        const data = await res.json();

        if (!data.success) return;

        const channels =
            data.channels || [];

        const selects = [

            "welcomeChannel",

            "leaveChannel",

            "modLogChannel",

            "rrChannel"

        ];

        selects.forEach(id => {

            const select = $(id);

            if (!select) return;

            select.innerHTML =
                `<option value="">Select Channel</option>`;

            channels.forEach(channel => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    channel.id;

                option.textContent =
                    channel.name;

                select.appendChild(
                    option
                );

            });

        });

    } catch (error) {

        console.log(
            "Channel Load Error",
            error
        );

    }

}

async function loadGuildRoles(guildId) {

    try {

        const res = await fetch(
            `${BACKEND}/api/guild/${guildId}/roles`
        );

        const data = await res.json();

        if (!data.success) return;

        const roles =
            data.roles || [];

        const selects = [

            "autoRole",

            "verifyRole",

            "rrRole"

        ];

        selects.forEach(id => {

            const select = $(id);

            if (!select) return;

            select.innerHTML =
                `<option value="">Select Role</option>`;

            roles.forEach(role => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    role.id;

                option.textContent =
                    role.name;

                select.appendChild(
                    option
                );

            });

        });

    } catch (error) {

        console.log(
            "Role Load Error",
            error
        );

    }

}
/* =========================
RUDRA DASHBOARD JS
PART 5
========================= */

async function loadGuildSettings(guildId) {

    try {

        const res = await fetch(
            `${BACKEND}/api/guild/${guildId}`
        );

        const data = await res.json();

        if (!data.success) return;

        const settings =
            data.settings || {};

        setValue(
            "prefix",
            Array.isArray(
                settings.prefixes
            )
                ? settings.prefixes.join(
                      " "
                  )
                : settings.prefix ||
                      "!"
        );

        setValue(
            "welcomeChannel",
            settings.welcomeChannel
        );

        setValue(
            "leaveChannel",
            settings.leaveChannel
        );

        setValue(
            "modLogChannel",
            settings.modLogChannel
        );

        setValue(
            "autoRole",
            settings.autoRole
        );

        setValue(
            "verifyRole",
            settings.verifyRole
        );

        setValue(
            "antiLink",
            String(
                settings.antiLink
            )
        );

        setValue(
            "antiSpam",
            String(
                settings.antiSpam
            )
        );

        setValue(
            "antiBot",
            String(
                settings.antiBot
            )
        );

        setValue(
            "welcomeMessage",
            settings.welcomeMessage
        );

        setValue(
            "leaveMessage",
            settings.leaveMessage
        );

        setValue(
            "limitMessage",
            settings.limitMessage
        );

    } catch (error) {

        console.log(
            "Settings Load Error",
            error
        );

    }

}

async function saveSettings() {

    if (!currentGuild) {

        return notify(
            "Select a server first."
        );

    }

    const prefixes = getValue(
        "prefix"
    )
        .split(" ")
        .filter(Boolean);

    const body = {

        prefixes,

        welcomeChannel:
            getValue(
                "welcomeChannel"
            ),

        leaveChannel:
            getValue(
                "leaveChannel"
            ),

        modLogChannel:
            getValue(
                "modLogChannel"
            ),

        autoRole:
            getValue(
                "autoRole"
            ),

        verifyRole:
            getValue(
                "verifyRole"
            ),

        antiLink:
            getValue(
                "antiLink"
            ) === "true",

        antiSpam:
            getValue(
                "antiSpam"
            ) === "true",

        antiBot:
            getValue(
                "antiBot"
            ) === "true",

        welcomeMessage:
            getValue(
                "welcomeMessage"
            ),

        leaveMessage:
            getValue(
                "leaveMessage"
            ),

        limitMessage:
            getValue(
                "limitMessage"
            )

    };

    try {

        const res = await fetch(

            `${BACKEND}/api/guild/${currentGuild}`,

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify(
                    body
                )

            }

        );

        const data =
            await res.json();

        if (data.success) {

            notify(
                "✅ Settings Saved"
            );

        } else {

            notify(
                "❌ Failed"
            );

        }

    } catch {

        notify(
            "❌ Backend Error"
        );

    }

}
/* =========================
RUDRA DASHBOARD JS
PART 6
========================= */

async function createReactionRole() {

    if (!currentGuild) {

        return notify(
            "Select a server first."
        );

    }

    const body = {

        guildId: currentGuild,

        channelId: getValue(
            "rrChannel"
        ),

        roleId: getValue(
            "rrRole"
        ),

        emoji: getValue(
            "rrEmoji"
        ),

        title: getValue(
            "rrTitle"
        ),

        description: getValue(
            "rrDescription"
        ),

        type: getValue(
            "rrType"
        )

    };

    try {

        const res = await fetch(

            `${BACKEND}/api/reactionrole/create`,

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify(
                    body
                )

            }

        );

        const data =
            await res.json();

        if (data.success) {

            notify(
                "✅ Reaction Role Created"
            );

            loadReactionRoles(
                currentGuild
            );

        } else {

            notify(

                data.message ||

                "Failed"

            );

        }

    } catch {

        notify(
            "❌ Backend Error"
        );

    }

}

async function loadReactionRoles(
    guildId
) {

    try {

        const res = await fetch(

            `${BACKEND}/api/reactionrole/${guildId}`

        );

        const data =
            await res.json();

        const list = $(
            "reactionRoleList"
        );

        if (!list) return;

        list.innerHTML = "";

        if (

            !Array.isArray(
                data
            ) ||

            data.length === 0

        ) {

            list.innerHTML = `

            <div class="server-item">

                No reaction roles found.

            </div>

            `;

            return;

        }

        data.forEach(rr => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "server-item";

            div.innerHTML = `

            <h3>${rr.title}</h3>

            <p>Emoji: ${rr.emoji}</p>

            <p>Role ID: ${rr.roleId}</p>

            <button onclick="deleteReactionRole('${rr._id}')">

                Delete

            </button>

            `;

            list.appendChild(
                div
            );

        });

    } catch (error) {

        console.log(
            error
        );

    }

}

async function deleteReactionRole(
    id
) {

    try {

        await fetch(

            `${BACKEND}/api/reactionrole/${id}`,

            {

                method: "DELETE"

            }

        );

        notify(
            "✅ Deleted"
        );

        loadReactionRoles(
            currentGuild
        );

    } catch {

        notify(
            "❌ Failed"
        );

    }

}

window.deleteReactionRole =
    deleteReactionRole;
/* =========================
RUDRA DASHBOARD JS
PART 7
========================= */

document.addEventListener(

    "click",

    event => {

        switch (event.target.id) {

            case "saveSettings":

                saveSettings();

                break;

            case "saveWelcome":

                saveSettings();

                break;

            case "saveLeave":

                saveSettings();

                break;

            case "saveAutomod":

                saveSettings();

                break;

            case "saveAI":

                saveSettings();

                break;

            case "saveDashboardSettings":

                saveSettings();

                break;

            case "createRR":

                createReactionRole();

                break;

        }

    }

);

async function loadOwnerPanel() {

    try {

        const res = await fetch(

            `${BACKEND}/api/owner/servers`,

            {

                credentials: "include"

            }

        );

        const data = await res.json();

        if (!data.success) {

            return;

        }

        setText(

            "ownerServers",

            data.total || 0

        );

        setText(

            "premiumServers",

            data.premium || 0

        );

        setText(

            "ownerUsers",

            data.users || 0

        );

    } catch (error) {

        console.log(

            "Owner panel error",

            error

        );

    }

}

setInterval(() => {

    if (

        currentGuild

    ) {

        loadDashboard();

        loadReactionRoles(

            currentGuild

        );

    }

}, 30000);

console.log(

    "✅ RUDRA Dashboard Loaded"

);
/* =========================
RUDRA DASHBOARD JS
PART 8
========================= */

function startAutoRefresh() {

    setInterval(async () => {

        try {

            await loadDashboard();

            if (currentGuild) {

                await loadGuildSettings(

                    currentGuild

                );

                await loadReactionRoles(

                    currentGuild

                );

            }

        } catch (error) {

            console.log(

                "Refresh Error",

                error

            );

        }

    }, 60000);

}

startAutoRefresh();

window.addEventListener(

    "DOMContentLoaded",

    () => {

        const firstButton = document.querySelector(

            ".sidebar-menu button"

        );

        if (firstButton) {

            firstButton.classList.add(

                "active"

            );

        }

    }

);

window.addEventListener(

    "beforeunload",

    () => {

        localStorage.setItem(

            "lastGuild",

            currentGuild || ""

        );

    }

);

window.addEventListener(

    "load",

    () => {

        const savedGuild = localStorage.getItem(

            "lastGuild"

        );

        if (

            savedGuild &&

            $("serverSelect")

        ) {

            $("serverSelect").value =

                savedGuild;

        }

    }

);

document.addEventListener(

    "keydown",

    event => {

        if (

            event.ctrlKey &&

            event.key === "s"

        ) {

            event.preventDefault();

            saveSettings();

        }

    }

);

console.log(

    "🚀 RUDRA Dashboard Ready"

);
