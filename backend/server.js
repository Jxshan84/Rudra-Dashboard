require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Client, GatewayIntentBits } = require("discord.js");
const mongoose = require("mongoose");
const app = express();

app.use(cors());
app.use(express.json());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

// Dashboard Health Check
app.get("/", (req, res) => {
  res.send("👑 Nexora Backend is Running!");
});

app.get("/health", (req, res) => {
  res.json({
    status: "online",
    bot: client.user ? client.user.tag : "Starting..."
  });
});

// Discord Bot Ready
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Login Bot
client.login(process.env.TOKEN);

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});