require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;

const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes
} = require("discord.js");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../")));

app.use(session({
  secret: process.env.SESSION_SECRET || "rudra-dashboard-secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(new DiscordStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.REDIRECT_URI,
  scope: ["identify", "guilds"]
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

const commands = [];
const commandsPath = path.join(__dirname, "commands");

if (fs.existsSync(commandsPath)) {
  const folders = fs.readdirSync(commandsPath);

  for (const folder of folders) {
    const folderPath = path.join(commandsPath, folder);
    if (!fs.lstatSync(folderPath).isDirectory()) continue;

    const files = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));

    for (const file of files) {
      const command = require(path.join(folderPath, file));

      if (!command.data || !command.execute) continue;

      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
    }
  }
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

app.use("/api/dashboard", require("./routes/dashboard")(client));
app.use("/api/guild", require("./routes/guild")(client));

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

app.get("/auth/discord", passport.authenticate("discord"));

app.get(
  "/auth/discord/callback",
  passport.authenticate("discord", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/dashboard/dashboard.html");
  }
);

app.get("/api/user", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ loggedIn: false });
  }

  res.json({
    loggedIn: true,
    id: req.user.id,
    username: req.user.username,
    discriminator: req.user.discriminator,
    avatar: req.user.avatar,
    guilds: req.user.guilds || []
  });
});

app.get("/api/guilds", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not logged in" });
  }

  const guilds = (req.user.guilds || []).filter(g => {
    return (BigInt(g.permissions) & BigInt(0x20)) === BigInt(0x20);
  });

  res.json(guilds);
});

app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

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
    console.error("SLASH REGISTER ERROR:", err);
  }
});


    client.on("interactionCreate", async interaction => {
  console.log("INTERACTION:", interaction.type, interaction.commandName);

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  console.log("COMMAND FOUND:", !!command);

  if (!command) {
    return interaction.reply({
      content: "❌ Command not found in bot.",
      ephemeral: true
    }).catch(console.error);
  }

  try {
    await interaction.deferReply({ ephemeral: false });

    await command.execute({
      ...interaction,
      reply: interaction.editReply.bind(interaction)
    });

  } catch (err) {
    console.error("COMMAND ERROR:", interaction.commandName, err);

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply("❌ Command error. Check Render logs.").catch(console.error);
    } else {
      await interaction.reply({
        content: "❌ Command error. Check Render logs.",
        ephemeral: true
      }).catch(console.error);
    }
  }
});
client.login(process.env.TOKEN);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});