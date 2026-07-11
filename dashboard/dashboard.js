/* =========================================================
   DASHBOARD.JS — PART 1
   Sidebar + Page Switch + Notifications
========================================================= */

const menuButtons = document.querySelectorAll(
  ".sidebar-menu button[data-page]"
);

const pages = document.querySelectorAll(".page");

/* =========================================================
   PAGE SWITCH
========================================================= */

menuButtons.forEach(button => {

  button.addEventListener("click", () => {

    const pageId = button.dataset.page;

    menuButtons.forEach(btn => {
      btn.classList.remove("active");
    });

    pages.forEach(page => {
      page.classList.remove("active");
    });

    button.classList.add("active");

    const selectedPage =
      document.getElementById(pageId);

    if (selectedPage) {
      selectedPage.classList.add("active");
    }

    localStorage.setItem(
      "rudra-last-page",
      pageId
    );

  });

});

/* =========================================================
   RESTORE LAST PAGE
========================================================= */

window.addEventListener("load", () => {

  const lastPage =
    localStorage.getItem(
      "rudra-last-page"
    );

  if (!lastPage) return;

  const savedButton =
    document.querySelector(
      `[data-page="${lastPage}"]`
    );

  const savedPage =
    document.getElementById(
      lastPage
    );

  if (!savedButton || !savedPage)
    return;

  menuButtons.forEach(btn => {
    btn.classList.remove("active");
  });

  pages.forEach(page => {
    page.classList.remove("active");
  });

  savedButton.classList.add("active");

  savedPage.classList.add("active");

});

/* =========================================================
   TOAST NOTIFICATION
========================================================= */

function showToast(
  message,
  type = "success"
) {

  const toast =
    document.createElement("div");

  toast.className =
    `rudra-toast ${type}`;

  let icon = "✅";

  if (type === "error") {
    icon = "❌";
  }

  if (type === "warning") {
    icon = "⚠️";
  }

  toast.innerHTML = `
    <span>${icon}</span>
    <span>${message}</span>
  `;

  document.body.appendChild(
    toast
  );

  setTimeout(() => {

    toast.classList.add(
      "show"
    );

  }, 50);

  setTimeout(() => {

    toast.classList.remove(
      "show"
    );

    setTimeout(() => {

      toast.remove();

    }, 300);

  }, 3000);

}

/* =========================================================
   SAVE BUTTONS
========================================================= */

document
  .querySelectorAll(
    "#saveSettings, \
     #saveWelcome, \
     #saveLeave, \
     #saveAI, \
     #saveModeration, \
     #saveTickets, \
     #saveGiveaway"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const oldText =
          button.innerHTML;

        button.innerHTML =
          "✅ Saved";

        showToast(
          "Settings saved successfully"
        );

        setTimeout(() => {

          button.innerHTML =
            oldText;

        }, 2000);

      }
    );

  });

console.log(
  "✅ RUDRA Dashboard Part 1 Loaded"
);
/* =========================================================
   DASHBOARD.JS — PART 2
   Live Welcome + Leave Preview + Variables
========================================================= */

const fakeData = {
  user: "@Jashan",
  username: "Jxshan84",
  server: "RUDRA Support",
  membercount: "2847",
  avatar: "https://cdn.discordapp.com/embed/avatars/0.png",
  date: new Date().toLocaleDateString(),
  time: new Date().toLocaleTimeString()
};

/* =========================================================
   VARIABLE REPLACE
========================================================= */

function parseVariables(text) {

  return text

    .replaceAll(
      "{user}",
      fakeData.user
    )

    .replaceAll(
      "{username}",
      fakeData.username
    )

    .replaceAll(
      "{server}",
      fakeData.server
    )

    .replaceAll(
      "{membercount}",
      fakeData.membercount
    )

    .replaceAll(
      "{avatar}",
      fakeData.avatar
    )

    .replaceAll(
      "{date}",
      fakeData.date
    )

    .replaceAll(
      "{time}",
      fakeData.time
    );
}

/* =========================================================
   WELCOME PREVIEW
========================================================= */

const welcomeInput =
  document.getElementById(
    "welcomeMessage"
  );

const welcomePreview =
  document.getElementById(
    "welcomePreview"
  );

function updateWelcomePreview() {

  if (
    !welcomeInput ||
    !welcomePreview
  ) return;

  welcomePreview.innerHTML = `

    <h3>
      👋 Welcome Preview
    </h3>

    <p>
      ${parseVariables(
        welcomeInput.value
      )}
    </p>

  `;
}

if (welcomeInput) {

  updateWelcomePreview();

  welcomeInput.addEventListener(
    "input",
    updateWelcomePreview
  );

}

/* =========================================================
   LEAVE PREVIEW
========================================================= */

const leaveInput =
  document.getElementById(
    "leaveMessage"
  );

const leavePreview =
  document.getElementById(
    "leavePreview"
  );

function updateLeavePreview() {

  if (
    !leaveInput ||
    !leavePreview
  ) return;

  leavePreview.innerHTML = `

    <h3>
      👋 Leave Preview
    </h3>

    <p>
      ${parseVariables(
        leaveInput.value
      )}
    </p>

  `;
}

if (leaveInput) {

  updateLeavePreview();

  leaveInput.addEventListener(
    "input",
    updateLeavePreview
  );

}

/* =========================================================
   VARIABLE BUTTONS
========================================================= */

document
  .querySelectorAll(
    ".variables span"
  )

  .forEach(variable => {

    variable.addEventListener(
      "click",
      () => {

        const text =
          variable.textContent;

        const activePage =
          document.querySelector(
            ".page.active textarea"
          );

        if (
          !activePage
        ) return;

        activePage.value +=
          " " + text;

        activePage.dispatchEvent(
          new Event(
            "input"
          )
        );

        showToast(
          `${text} inserted`
        );

      }
    );

  });

console.log(
  "✅ Welcome / Leave preview loaded"
);
/* =========================================================
   DASHBOARD.JS — PART 4
   Theme Switcher + Premium Lock + Owner Panel
========================================================= */

/* =========================================================
   THEME SYSTEM
========================================================= */

const themeSelect =
  document.getElementById(
    "theme"
  );

function applyTheme(theme) {

  document.body.classList.remove(
    "theme-red",
    "theme-dark",
    "theme-purple"
  );

  document.body.classList.add(
    `theme-${theme}`
  );

  localStorage.setItem(
    "rudra-theme",
    theme
  );

}

const savedTheme =
  localStorage.getItem(
    "rudra-theme"
  ) || "dark";

applyTheme(savedTheme);

if (themeSelect) {

  themeSelect.value =
    savedTheme;

  themeSelect.addEventListener(
    "change",
    () => {

      applyTheme(
        themeSelect.value
      );

      showToast(
        `Theme changed to ${themeSelect.value}`
      );

    }
  );

}

/* =========================================================
   PREMIUM LOCK
========================================================= */

const isPremium =
  localStorage.getItem(
    "rudra-premium"
  ) === "true";

document
  .querySelectorAll(
    ".premium-feature"
  )
  .forEach(card => {

    if (
      isPremium
    ) return;

    card.classList.add(
      "locked"
    );

    const lock =
      document.createElement(
        "div"
      );

    lock.className =
      "premium-lock";

    lock.innerHTML = `

      <i class="fa-solid fa-crown"></i>

      <span>

        Premium Only

      </span>

    `;

    card.appendChild(
      lock
    );

  });

/* =========================================================
   ENABLE PREMIUM
========================================================= */

const premiumButton =
  document.getElementById(
    "enablePremium"
  );

premiumButton?.addEventListener(
  "click",
  () => {

    localStorage.setItem(
      "rudra-premium",
      "true"
    );

    showToast(
      "Premium activated 👑"
    );

    setTimeout(() => {

      location.reload();

    }, 1500);

  }
);

/* =========================================================
   OWNER PANEL
========================================================= */

const ownerPage =
  document.getElementById(
    "owner"
  );

const ownerButtons =
  document.querySelectorAll(
    ".owner-only"
  );

const ownerId =
  "YOUR_DISCORD_ID";

const currentUserId =
  window.currentUserId || "";

if (
  currentUserId === ownerId
) {

  ownerButtons.forEach(
    element => {

      element.style.display =
        "flex";

    }
  );

} else {

  ownerButtons.forEach(
    element => {

      element.remove();

    }
  );

}

/* =========================================================
   OWNER STATS
========================================================= */

const ownerServers =
  document.getElementById(
    "ownerServers"
  );

const ownerUsers =
  document.getElementById(
    "ownerUsers"
  );

const premiumServers =
  document.getElementById(
    "premiumServers"
  );

const ownerBotStatus =
  document.getElementById(
    "ownerBotStatus"
  );

function updateOwnerStats() {

  if (ownerServers)
    ownerServers.textContent =
      "0";

  if (premiumServers)
    premiumServers.textContent =
      "0";

  if (ownerUsers)
    ownerUsers.textContent =
      "0";

  if (ownerBotStatus)
    ownerBotStatus.textContent =
      "🟢 Online";

}

updateOwnerStats();

/* =========================================================
   BROADCAST
========================================================= */

const broadcastButton =
  document.getElementById(
    "sendBroadcast"
  );

broadcastButton?.addEventListener(
  "click",
  () => {

    const message =
      document.getElementById(
        "broadcastMessage"
      )?.value;

    if (
      !message
    ) {

      return showToast(
        "Write a message first",
        "warning"
      );

    }

    showToast(
      "Broadcast sent 📢"
    );

  }
);

console.log(
  "✅ RUDRA Dashboard Part 4 Loaded"
);