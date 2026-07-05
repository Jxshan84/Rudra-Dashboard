require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes
} = require("discord.js");

const app = express();

app.use(cors());
app.use(express.json());

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// Load Commands
const commands = [];
const commandsPath = path.join(__dirname, "commands");

if (fs.existsSync(commandsPath)) {
  const folders = fs.readdirSync(commandsPath);

  for (const folder of folders) {
    const folderPath = path.join(commandsPath, folder);

    if (!fs.lstatSync(folderPath).isDirectory()) continue;

    const files = fs.readdirSync(folderPath).filter(f => f.endsWith(".js"));

    for (const file of files) {
      const command = require(path.join(folderPath, file));

      if (!command.data || !command.execute) continue;

      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
    }
  }
}

// MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// Home
app.get("/", (req, res) => {
  res.send("👑 Rudra Backend Running");
});

// Health
app.get("/health", (req, res) => {
  res.json({
    status: client.isReady() ? "Online" : "Offline",
    bot: client.user?.tag || "Starting...",
    ping: client.ws.ping,
    servers: client.guilds.cache.size,
    users: client.guilds.cache.reduce(
      (a, g) => a + (g.memberCount || 0),
      0
    )
  });
});

// Ready
client.once("clientReady", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log(`✅ Registered ${commands.length} slash commands.`);
  } catch (err) {
    console.error(err);
  }
});

// Slash Commands
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "❌ Command Error",
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: "❌ Command Error",
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