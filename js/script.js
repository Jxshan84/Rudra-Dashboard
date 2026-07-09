const BACKEND = "https://nexora-dashboard-klgw.onrender.com";

// Redirect if already logged in
(async () => {
  try {
    const res = await fetch(`${BACKEND}/api/user`, {
      credentials: "include"
    });

    if (res.ok) {
      const data = await res.json();

      if (data.loggedIn) {
        window.location.href = `${BACKEND}/dashboard/dashboard.html`;
      }
    }
  } catch (err) {
    console.log("Not logged in.");
  }
})();

// Online Status Check
async function updateStatus() {
  const statusText = document.querySelector(".status strong");
  const dot = document.querySelector(".online-dot");

  if (!statusText || !dot) return;

  try {
    const res = await fetch(`${BACKEND}/health`);
    const data = await res.json();

    if (data.status === "Online") {
      statusText.textContent = "ONLINE";
      statusText.style.color = "#00ff88";
      dot.style.background = "#00ff88";
      dot.style.boxShadow = "0 0 15px #00ff88";
    } else {
      statusText.textContent = "OFFLINE";
      statusText.style.color = "#ff3b3b";
      dot.style.background = "#ff3b3b";
      dot.style.boxShadow = "0 0 15px #ff3b3b";
    }

  } catch {

    statusText.textContent = "OFFLINE";
    statusText.style.color = "#ff3b3b";
    dot.style.background = "#ff3b3b";
    dot.style.boxShadow = "0 0 15px #ff3b3b";

  }
}

updateStatus();

setInterval(updateStatus, 10000);

// Card Animation
const card = document.querySelector(".glass");

document.addEventListener("mousemove", (e) => {

  if (!card) return;

  const x = (window.innerWidth / 2 - e.clientX) / 40;
  const y = (window.innerHeight / 2 - e.clientY) / 40;

  card.style.transform =
    `rotateY(${-x}deg) rotateX(${y}deg)`;

});

document.addEventListener("mouseleave", () => {

  if (!card) return;

  card.style.transform =
    "rotateX(0deg) rotateY(0deg)";

});

// Keyboard Shortcut
document.addEventListener("keydown", e => {

  if (e.key === "Enter") {

    window.location.href =
      `${BACKEND}/auth/discord`;

  }

});

console.log("✅ RUDRA Login Loaded");