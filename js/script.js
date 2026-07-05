// ==========================
// NEXORA DASHBOARD
// script.js
// ==========================

// Welcome Message

window.addEventListener("load", () => {
    console.log("👑 Nexora Dashboard Loaded");
});

// Sidebar Active

const menuItems = document.querySelectorAll(".sidebar ul li");

menuItems.forEach(item => {

    item.addEventListener("click", () => {

        menuItems.forEach(i => i.classList.remove("active"));

        item.classList.add("active");

    });

});

// Fake Counter Animation

const cards = document.querySelectorAll(".card h2");

const values = ["125", "18.4K", "99.9%", "24/7"];

cards.forEach((card, index) => {

    if (values[index]) {

        card.innerText = values[index];

    }

});

// Login Button

const loginBtns = document.querySelectorAll(".login-btn");

loginBtns.forEach(btn => {

    btn.addEventListener("click", () => {

        alert("Discord OAuth Login will be added in Backend.");

    });

});

// Configure Buttons

const configBtns = document.querySelectorAll(".action-btn");

configBtns.forEach(btn => {

    btn.addEventListener("click", () => {

        alert("This module will be available soon.");

    });

});

// Smooth Scroll

document.querySelectorAll("a").forEach(anchor => {

    anchor.addEventListener("click", function(e) {

        const href = this.getAttribute("href");

        if (href && href.startsWith("#")) {

            e.preventDefault();

            document.querySelector(href).scrollIntoView({

                behavior: "smooth"

            });

        }

    });

});
async function loadStatus() {

    try {

        const res = await fetch("http://localhost:3000/health");

        const data = await res.json();

        const status = document.querySelector(".status-card h3");
        const text = document.querySelector(".status-card p");

        status.textContent = "🟢 " + data.status;

        text.textContent = "Bot: " + data.bot;

    } catch (err) {

        console.error(err);

    }

}

loadStatus();

setInterval(loadStatus, 5000);
