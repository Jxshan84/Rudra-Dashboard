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
  Partials,
  Collection,
  REST,
  Routes,
  Events,
  MessageFlags,
  ActivityType
} = require("discord.js");

const GuildSettings = require("./models/GuildSettings");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================================================
   EXPRESS
========================================================= */

app.set("trust proxy", 1);

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../")));

/* =========================================================
   SESSION + PASSPORT
========================================================= */

app.use(
  session({
    secret: process.env.SESSION_SECRET || "rudra-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.REDIRECT_URI,
      scope: ["identify", "guilds"]
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

/* =========================================================
   DISCORD CLIENT
========================================================= */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.DirectMessages
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.Reaction,
    Partials.User,
    Partials.GuildMember
  ]
});

client.commands = new Collection();
client.prefixCommands = new Collection();

const slashCommands = [];

/* =========================================================
   COMMAND LOADER
========================================================= */

function loadCommands(directory) {
  if (!fs.existsSync(directory)) {
    console.log(`⚠️ Commands folder not found: ${directory}`);
    return;
  }

  const entries = fs.readdirSync(directory, {
    withFileTypes: true
  });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      loadCommands(fullPath);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".js")) {
      continue;
    }

    try {
      const command = require(fullPath);

      if (
        !command.data ||
        !command.data.name ||
        typeof command.data.toJSON !== "function" ||
        typeof command.execute !== "function"
      ) {
        console.log(`⚠️ Invalid command skipped: ${fullPath}`);
        continue;
      }

      const commandName = command.data.name.toLowerCase();

      client.commands.set(commandName, command);
      client.prefixCommands.set(commandName, command);

      slashCommands.push(command.data.toJSON());

      if (Array.isArray(command.aliases)) {
        for (const alias of command.aliases) {
          if (
            typeof alias === "string" &&
            alias.trim()
          ) {
            client.prefixCommands.set(
              alias.trim().toLowerCase(),
              command
            );
          }
        }
      }

      console.log(`✅ Command loaded: ${commandName}`);
    } catch (error) {
      console.error(`❌ Failed to load command: ${fullPath}`);
      console.error(error);
    }
  }
}

loadCommands(path.join(__dirname, "commands"));

/* =========================================================
   REACTION ROLE EVENT
========================================================= */

const reactionRoleEvent = path.join(
  __dirname,
  "events",
  "reactionRole.js"
);

if (fs.existsSync(reactionRoleEvent)) {
  try {
    require(reactionRoleEvent)(client);
    console.log("✅ Reaction role event loaded");
  } catch (error) {
    console.error(
      "❌ Reaction role event failed to load:",
      error
    );
  }
}

/* =========================================================
   DATABASE
========================================================= */

async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is missing in environment variables."
    );
  }

  await mongoose.connect(process.env.MONGODB_URI);

  console.log("✅ MongoDB connected");
}

mongoose.connection.on("error", error => {
  console.error("❌ MongoDB error:", error);
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected");
});

/* =========================================================
   DASHBOARD API ROUTES
========================================================= */

app.use(
  "/api/dashboard",
  require("./routes/dashboard")(client)
);

app.use(
  "/api/guild",
  require("./routes/guild")(client)
);

app.use(
  "/api/owner",
  require("./routes/owner")(client)
);

app.use(
  "/api/reactionrole",
  require("./routes/reactionrole")(client)
);

/* =========================================================
   HEALTH ROUTE
========================================================= */

app.get("/health", (req, res) => {
  const users = client.guilds.cache.reduce(
    (total, guild) =>
      total + (guild.memberCount || 0),
    0
  );

  res.status(200).json({
    status: "ok",
    bot: client.user ? "online" : "starting",
    ping:
      client.ws.ping >= 0
        ? client.ws.ping
        : 0,
    servers: client.guilds.cache.size,
    users,
    commands: client.commands.size,
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected"
  });
});

/* =========================================================
   DISCORD LOGIN
========================================================= */

app.get(
  "/auth/discord",
  passport.authenticate("discord", {
    scope: ["identify", "guilds"]
  })
);

app.get(
  "/auth/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: "/"
  }),
  (req, res) => {
    res.redirect("/dashboard/dashboard.html");
  }
);

/* =========================================================
   USER API
========================================================= */

app.get("/api/user", (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      loggedIn: false
    });
  }

  return res.json({
    loggedIn: true,
    owner:
      req.user.id === process.env.OWNER_ID,
    id: req.user.id,
    username: req.user.username,
    discriminator: req.user.discriminator,
    avatar: req.user.avatar,
    guilds: req.user.guilds || []
  });
});

/* =========================================================
   MANAGEABLE GUILDS
========================================================= */

app.get("/api/guilds", (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  const guilds = (req.user.guilds || [])
    .filter(guild => {
      if (guild.owner) {
        return true;
      }

      try {
        const permissions = BigInt(
          guild.permissions || "0"
        );

        return (
          (permissions & 32n) === 32n
        );
      } catch {
        return false;
      }
    })
    .map(guild => ({
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
      owner: Boolean(guild.owner),
      permissions: guild.permissions,
      botAdded: client.guilds.cache.has(
        guild.id
      )
    }));

  return res.json(guilds);
});

/* =========================================================
   LOGOUT
========================================================= */

app.get("/logout", (req, res, next) => {
  req.logout(error => {
    if (error) {
      return next(error);
    }

    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });
});

/* =========================================================
   READY + SLASH COMMAND REGISTRATION
========================================================= */

client.once(
  Events.ClientReady,
  async readyClient => {
    console.log(
      `✅ ${readyClient.user.tag} is online`
    );

    readyClient.user.setPresence({
      status: "online",
      activities: [
        {
          name: "/help | Rudra",
          type: ActivityType.Watching
        }
      ]
    });

    try {
      const rest = new REST({
        version: "10"
      }).setToken(process.env.TOKEN);

      console.log(
        `🔄 Registering ${slashCommands.length} slash commands...`
      );

      await rest.put(
        Routes.applicationCommands(
          process.env.CLIENT_ID
        ),
        {
          body: slashCommands
        }
      );

      console.log(
        `✅ Registered ${slashCommands.length} slash commands`
      );
    } catch (error) {
      console.error(
        "❌ Slash command registration failed:",
        error
      );
    }
  }
);

/* =========================================================
   SLASH COMMAND HANDLER
========================================================= */

client.on(
  Events.InteractionCreate,
  async interaction => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = client.commands.get(
      interaction.commandName.toLowerCase()
    );

    if (!command) {
      return interaction.reply({
        content:
          "❌ This command was not found.",
        flags: MessageFlags.Ephemeral
      });
    }

    try {
      console.log(
        `⚡ /${interaction.commandName} used by ${interaction.user.tag}`
      );

      await command.execute(
        interaction,
        client
      );
    } catch (error) {
      console.error(
        `❌ Error in /${interaction.commandName}:`,
        error
      );

      const response = {
        content:
          "❌ There was an error while running this command.",
        flags: MessageFlags.Ephemeral
      };

      if (
        interaction.replied ||
        interaction.deferred
      ) {
        await interaction
          .followUp(response)
          .catch(() => null);
      } else {
        await interaction
          .reply(response)
          .catch(() => null);
      }
    }
  }
);

/* =========================================================
   PREFIX COMMAND HANDLER
========================================================= */

client.on(
  Events.MessageCreate,
  async message => {
    if (
      !message.guild ||
      message.author.bot
    ) {
      return;
    }

    try {
      let settings =
        await GuildSettings.findOne({
          guildId: message.guild.id
        });

      if (!settings) {
        settings =
          await GuildSettings.create({
            guildId: message.guild.id,
            prefixes: ["!"],
            defaultPrefix: "!"
          });
      }

      const savedPrefixes =
        Array.isArray(settings.prefixes) &&
        settings.prefixes.length
          ? settings.prefixes
          : [
              settings.defaultPrefix ||
                settings.prefix ||
                "!"
            ];

      const prefixes = [
        ...new Set(savedPrefixes)
      ]
        .filter(
          prefix =>
            typeof prefix === "string"
        )
        .map(prefix => prefix.trim())
        .filter(Boolean)
        .sort(
          (first, second) =>
            second.length - first.length
        );

      const usedPrefix = prefixes.find(
        prefix =>
          message.content.startsWith(
            prefix
          )
      );

      if (!usedPrefix) {
        return;
      }

      const commandBody =
        message.content
          .slice(usedPrefix.length)
          .trim();

      if (!commandBody) {
        return;
      }

      const args =
        commandBody.split(/\s+/);

      const commandName = args
        .shift()
        .toLowerCase();

      const command =
        client.prefixCommands.get(
          commandName
        ) ||
        client.commands.get(commandName);

      if (!command) {
        return;
      }

      console.log(
        `⚡ ${usedPrefix}${commandName} used by ${message.author.tag}`
      );

      /* =====================================================
         FAKE INTERACTION FOR PREFIX COMMANDS
      ===================================================== */

      const fakeInteraction = {
        client,

        commandName: command.data.name,

        guild: message.guild,
        guildId: message.guild.id,

        member: message.member,
        user: message.author,

        channel: message.channel,
        channelId: message.channel.id,

        deferred: false,
        replied: false,

        options: {
          getUser: () =>
            message.mentions.users.first(),

          getMember: () =>
            message.mentions.members.first(),

          getString: () =>
            args.slice(1).join(" "),

          getInteger: () =>
            Number(args[1]),

          getNumber: () =>
            Number(args[1]),

          getBoolean: () => false,

          getChannel: () =>
            message.mentions.channels.first(),

          getRole: () =>
            message.mentions.roles.first(),

          getMentionable: () =>
            message.mentions.members.first() ||
            message.mentions.roles.first(),

          getSubcommand: () => args[0]
        },

        reply: async data => {
          fakeInteraction.replied = true;

          return message.reply(data);
        },

        deferReply: async () => {
          fakeInteraction.deferred = true;
        },

        editReply: async data => {
          fakeInteraction.replied = true;

          return message.reply(data);
        },

        followUp: async data => {
          return message.reply(data);
        }
      };

      if (
        typeof command.prefixExecute ===
        "function"
      ) {
        await command.prefixExecute({
          message,
          args,
          client,
          prefix: usedPrefix,
          settings
        });
      } else if (
        typeof command.execute ===
        "function"
      ) {
        await command.execute(
          fakeInteraction,
          client
        );
      }
    } catch (error) {
      console.error(
        "❌ Prefix command error:",
        error
      );

      await message
        .reply(
          "❌ There was an error while running this command."
        )
        .catch(() => null);
    }
  }
);

/* =========================================================
   START RUDRA ONCE
========================================================= */

let httpServer = null;

async function startRudra() {
  const requiredVariables = [
    "TOKEN",
    "CLIENT_ID",
    "MONGODB_URI",
    "SESSION_SECRET",
    "CLIENT_SECRET",
    "REDIRECT_URI"
  ];

  const missingVariables =
    requiredVariables.filter(
      variable =>
        !process.env[variable]
    );

  if (missingVariables.length) {
    throw new Error(
      `Missing environment variables: ${missingVariables.join(
        ", "
      )}`
    );
  }

  await connectDatabase();

  await client.login(
    process.env.TOKEN
  );

  httpServer = app.listen(
    PORT,
    "0.0.0.0",
    () => {
      console.log(
        `✅ Rudra backend running on port ${PORT}`
      );
    }
  );
}

startRudra().catch(error => {
  console.error(
    "❌ Rudra failed to start:",
    error
  );

  process.exit(1);
});

/* =========================================================
   PROCESS ERROR HANDLERS
========================================================= */

process.on(
  "unhandledRejection",
  error => {
    console.error(
      "❌ Unhandled promise rejection:",
      error
    );
  }
);

process.on(
  "uncaughtException",
  error => {
    console.error(
      "❌ Uncaught exception:",
      error
    );
  }
);

async function shutdown(signal) {
  console.log(
    `⚠️ ${signal} received. Shutting down...`
  );

  if (httpServer) {
    await new Promise(resolve =>
      httpServer.close(resolve)
    );
  }

  client.destroy();

  await mongoose.connection
    .close()
    .catch(() => null);

  process.exit(0);
}

process.once("SIGTERM", () =>
  shutdown("SIGTERM")
);

process.once("SIGINT", () =>
  shutdown("SIGINT")
);
