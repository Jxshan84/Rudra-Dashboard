require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Client, GatewayIntentBits } = require("discord.js");

const commandHandler = require("./handlers/commandHandler");

const app = express();

app.use(cors());
app.use(express.json());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

// MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// Home Route
app.get("/", (req, res) => {
  res.send("👑 Rudra Backend Running");
});

// Health API
app.get("/health", (req, res) => {
  res.json({
    status: client.isReady() ? "Online" : "Offline",
    bot: client.user?.tag || "Starting...",
    ping: client.ws.ping,
    servers: client.guilds.cache.size,
    users: client.guilds.cache.reduce(
      (total, guild) => total + (guild.memberCount || 0),
      0
    )
  });
});

// Bot Ready
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  commandHandler(client);

  console.log(`✅ Loaded ${client.commands.size} commands.`);
});

// Slash Command Handler
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "❌ There was an error while executing this command.",
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: "❌ There was an error while executing this command.",
        ephemeral: true
      });
    }
  }
});

// Login
client.login(process.env.TOKEN);

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});