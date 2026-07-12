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

app.use(
cors({
origin: true,
credentials: true
})
);

app.use(express.json());

app.use(
express.urlencoded({
extended: true
})
);

app.use(
express.static(
path.join(__dirname, "../")
)
);

/* =========================================================
SESSION
========================================================= */

app.set("trust proxy", 1);

app.use(
session({
secret:
process.env.SESSION_SECRET ||
"rudra-dashboard-secret",

resave: false,  

saveUninitialized: false,  

cookie: {  
  maxAge:  
    7 *  
    24 *  
    60 *  
    60 *  
    1000,  

  httpOnly: true,  

  sameSite: "lax",  

  secure:  
    process.env.NODE_ENV ===  
    "production"  
}

})
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(
(user, done) => {
done(null, user);
}
);

passport.deserializeUser(
(user, done) => {
done(null, user);
}
);

/* =========================================================
DISCORD OAUTH
========================================================= */

passport.use(
new DiscordStrategy(
{
clientID:
process.env.CLIENT_ID,

clientSecret:  
    process.env.CLIENT_SECRET,  

  callbackURL:  
    process.env.REDIRECT_URI,  

  scope: [  
    "identify",  
    "guilds"  
  ]  
},  

(  
  accessToken,  
  refreshToken,  
  profile,  
  done  
) => {  
  return done(  
    null,  
    profile  
  );  
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

GatewayIntentBits  
  .GuildMessageReactions,  

GatewayIntentBits  
  .MessageContent,  

GatewayIntentBits  
  .GuildVoiceStates

],

partials: [
Partials.Message,

Partials.Channel,  

Partials.Reaction,  

Partials.User,  

Partials.GuildMember

]
});

client.commands =
new Collection();

client.prefixCommands =
new Collection();

/* =========================================================
COMMAND LOADER
========================================================= */

const slashCommandMap = new Map();

function loadCommands(directory) {

if (!fs.existsSync(directory)) {
console.log(
  `⚠️ Commands folder missing: ${directory}`
);

return;

}

const entries = fs.readdirSync(
directory,
{
withFileTypes: true
}
);

for (const entry of entries) {

const fullPath = path.join(  
  directory,  
  entry.name  
);  

if (entry.isDirectory()) {  
  loadCommands(fullPath);  
  continue;  
}  

if (  
  !entry.name.endsWith(".js")  
) {  
  continue;  
}  

try {  

  delete require.cache[  
    require.resolve(fullPath)  
  ];  

  const command =  
    require(fullPath);  

  if (  
    !command.data ||  
    typeof command.execute !==  
      "function"  
  ) {  
    console.log(  
      `⚠️ Invalid command skipped: ${fullPath}`  
    );  

    continue;  
  }  

  const commandName =  
    command.data.name;  

  if (!commandName) {  
    console.log(  
      `⚠️ Command without name skipped: ${fullPath}`  
    );  

    continue;  
  }  

  if (  
    client.commands.has(  
      commandName  
    )  
  ) {  
    console.log(  
      `⚠️ Duplicate command skipped: ${commandName}`  
    );  

    continue;  
  }  

  client.commands.set(  
    commandName,  
    command  
  );  

  slashCommandMap.set(  
    commandName,  
    command.data.toJSON()  
  );  

  client.prefixCommands.set(  
    commandName.toLowerCase(),  
    command  
  );  

  if (  
    Array.isArray(  
      command.aliases  
    )  
  ) {  
    for (  
      const alias of command.aliases  
    ) {  
      client.prefixCommands.set(  
        String(alias)  
          .toLowerCase(),  
        command  
      );  
    }  
  }  

  console.log(  
    `✅ Loaded command: ${commandName}`  
  );  

} catch (error) {  

  console.error(  
    `❌ Failed loading command ${fullPath}:`,  
    error  
  );  

}

}
}

loadCommands(
  path.join(
    __dirname,
    "commands"
  )
);

console.log(
  `✅ Total slash commands loaded: ${client.commands.size}`
);

console.log(
  `✅ Total prefix commands loaded: ${client.prefixCommands.size}`
);

/* =========================================================
EVENTS
========================================================= */

const reactionRoleEvent =
path.join(
__dirname,
"events",
"reactionRole.js"
);

if (
fs.existsSync(
reactionRoleEvent
)
) {
try {
require(
reactionRoleEvent
)(client);

console.log(  
  "✅ Reaction role event loaded"  
);

} catch (error) {
console.error(
"❌ Reaction role event error:",
error
);
}
}

/* =========================================================
API ROUTES
========================================================= */

app.use(
"/api/dashboard",
require(
"./routes/dashboard"
)(client)
);

app.use(
"/api/guild",
require(
"./routes/guild"
)(client)
);

app.use(
"/api/owner",
require(
"./routes/owner"
)(client)
);

app.use(
"/api/reactionrole",
require(
"./routes/reactionrole"
)(client)
);

/* =========================================================
HEALTH
========================================================= */

app.get(
"/health",
(req, res) => {
const totalUsers =
client.guilds.cache.reduce(
(
total,
guild
) =>
total +
(
guild.memberCount ||
0
),

0  
  );  

return res.json({  
  status:  
    client.isReady()  
      ? "Online"  
      : "Offline",  

  bot:  
    client.user?.tag ||  
    "Starting...",  

  ping:  
    client.ws.ping ||  
    0,  

  servers:  
    client.guilds.cache.size,  

  users:  
    totalUsers,  

  commands:  
    client.commands.size,  

  database:  
    mongoose.connection  
      .readyState === 1  
      ? "Connected"  
      : "Disconnected"  
});

}
);

/* =========================================================
OAUTH ROUTES
========================================================= */

app.get(
"/auth/discord",

passport.authenticate(
"discord"
)
);

app.get(
"/auth/discord/callback",

passport.authenticate(
"discord",
{
failureRedirect: "/"
}
),

(req, res) => {
return res.redirect(
"/dashboard/dashboard.html"
);
}
);

app.get(
"/api/user",
(req, res) => {
if (!req.user) {
return res
.status(401)
.json({
loggedIn: false
});
}

return res.json({  
  loggedIn: true,  

  owner:  
    req.user.id ===  
    process.env.OWNER_ID,  

  id:  
    req.user.id,  

  username:  
    req.user.username,  

  discriminator:  
    req.user.discriminator,  

  avatar:  
    req.user.avatar,  

  guilds:  
    req.user.guilds ||  
    []  
});

}
);

app.get(
"/api/guilds",
(req, res) => {
if (!req.user) {
return res
.status(401)
.json({
success: false,

message:  
        "Not logged in"  
    });  
}  

const manageableGuilds =  
  (  
    req.user.guilds ||  
    []  
  ).filter(guild => {  
    try {  
      const permissions =  
        BigInt(  
          guild.permissions ||  
          "0"  
        );  

      const manageGuild =  
        BigInt(0x20);  

      const administrator =  
        BigInt(0x8);  

      return (  
        (  
          permissions &  
          manageGuild  
        ) ===  
          manageGuild ||  

        (  
          permissions &  
          administrator  
        ) ===  
          administrator  
      );  
    } catch {  
      return false;  
    }  
  });  

return res.json(  
  manageableGuilds  
);

}
);

app.get(
"/logout",
(req, res) => {
req.logout(error => {
if (error) {
console.error(
"Logout error:",
error
);
}

return res.redirect("/");  
});

}
);

/* =========================================================
REGISTER SLASH COMMANDS
========================================================= */

async function registerSlashCommands() {
const slashCommandsJSON =
Array.from(
slashCommandMap.values()
);

const rest =
new REST({
version: "10"
}).setToken(
process.env.TOKEN
);

try {
if (
process.env.GUILD_ID
) {
await rest.put(
Routes
.applicationGuildCommands(
process.env.CLIENT_ID,
process.env.GUILD_ID
),

{  
      body:  
        slashCommandsJSON  
    }  
  );  

  console.log(  
    `✅ Registered ${slashCommandsJSON.length} guild slash commands`  
  );  

  return;  
}  

await rest.put(  
  Routes.applicationCommands(  
    process.env.CLIENT_ID  
  ),  

  {  
    body:  
      slashCommandsJSON  
  }  
);  

console.log(  
  `✅ Registered ${slashCommandsJSON.length} global slash commands`  
);

} catch (error) {
console.error(
"❌ Slash command registration error:",
error
);
}
}

/* =========================================================
CLIENT READY
========================================================= */
client.once(
  Events.ClientReady,

  async readyClient => {
    console.log(
      `✅ Logged in as ${readyClient.user.tag}`
    );

    readyClient.user.setActivity(
      "/help | RUDRA",

      {
        type:
          ActivityType.Watching
      }
    );

    await registerSlashCommands();
  }
);

/* =========================================================
SLASH COMMAND HANDLER
========================================================= */

client.on(
Events.InteractionCreate,

async interaction => {
if (
!interaction
.isChatInputCommand()
) {
return;
}

const command =  
  client.commands.get(  
    interaction.commandName  
  );  

console.log(  
  `⚡ /${interaction.commandName} | ${interaction.user.tag}`  
);  

if (!command) {  
  return interaction  
    .reply({  
      content:  
        "❌ This command is not loaded in RUDRA.",  

      flags:  
        MessageFlags.Ephemeral  
    })  
    .catch(() => {});  
}  

try {  
  await command.execute(  
    interaction,  
    client  
  );  
} catch (error) {  
  console.error(  
    `❌ Command error /${interaction.commandName}:`,  
    error  
  );  

  const errorMessage = {  
    content:  
      "❌ Command failed. Check bot permissions and Render logs.",  

    flags:  
      MessageFlags.Ephemeral  
  };  

  try {  
    if (  
      interaction.deferred  
    ) {  
      await interaction.editReply({  
        content:  
          errorMessage.content  
      });  
    } else if (  
      interaction.replied  
    ) {  
      await interaction.followUp(  
        errorMessage  
      );  
    } else {  
      await interaction.reply(  
        errorMessage  
      );  
    }  
  } catch (  
    replyError  
  ) {  
    console.error(  
      `❌ Error response failed /${interaction.commandName}:`,  
      replyError  
    );  
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
      message.author.bot ||
      !message.guild ||
      !message.content
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

      let prefixes =
        Array.isArray(settings.prefixes)
          ? settings.prefixes
          : [];

      if (!prefixes.length) {
        prefixes = [
          settings.defaultPrefix ||
          settings.prefix ||
          "!"
        ];
      }

      prefixes = prefixes
        .map(prefix =>
          String(prefix).trim()
        )
        .filter(Boolean)
        .sort(
          (a, b) =>
            b.length - a.length
        );

      const usedPrefix =
        prefixes.find(prefix =>
          message.content.startsWith(
            prefix
          )
        );

      if (!usedPrefix) {
        return;
      }

      const content =
        message.content
          .slice(usedPrefix.length)
          .trim();

      if (!content) {
        return;
      }

      const args =
        content.split(/\s+/);

      const commandName =
        args.shift().toLowerCase();

      /* =====================================================
         BUILT-IN PING
      ===================================================== */

      if (commandName === "ping") {
        return message.reply(
          `🏓 Pong! **${client.ws.ping || 0}ms**`
        );
      }

      /* =====================================================
         BUILT-IN PREFIX
      ===================================================== */

      if (
        commandName === "prefix" ||
        commandName === "prefixes"
      ) {
        return message.reply(
          `⚙️ **RUDRA Prefixes**\n` +
          `${prefixes
            .map(
              prefix =>
                `\`${prefix}\``
            )
            .join(" ")}\n\n` +
          `Default: \`${
            settings.defaultPrefix ||
            prefixes[0]
          }\``
        );
      }

      /* =====================================================
         BUILT-IN HELP
      ===================================================== */

      if (commandName === "help") {
        const commandNames = [
          ...new Set(
            client.commands.map(
              command =>
                command.data.name
            )
          )
        ].sort();

        const visibleCommands =
          commandNames
            .slice(0, 40)
            .map(
              name =>
                `\`/${name}\``
            )
            .join(" ");

        return message.reply({
          content:
            `🛡️ **RUDRA Help**\n\n` +
            `**Server prefixes:** ${prefixes
              .map(
                prefix =>
                  `\`${prefix}\``
              )
              .join(" ")}\n\n` +
            `**Commands:**\n${visibleCommands}\n\n` +
            "Use `/help` for the complete help menu."
        });
      }

      const command =
        client.prefixCommands.get(
          commandName
        ) ||
        client.commands.get(
          commandName
        );

      if (!command) {
        return message.reply(
          `❌ Prefix command \`${commandName}\` not found.`
        );
      }

      console.log(
        `⚡ ${usedPrefix}${commandName} | ${message.author.tag}`
      );

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

        return;
      }

      const firstNumber =
        args.find(argument =>
          !Number.isNaN(
            Number(argument)
          )
        );

      const reasonArgs =
        args.filter(argument =>
          !/^<@!?\d+>$/.test(argument)
        );

            const normalizeReply = data => {
        if (typeof data === "string") {
          return {
            content: data
          };
        }

        const payload = {
          ...data
        };

        delete payload.ephemeral;
        delete payload.flags;
        delete payload.fetchReply;

        return payload;
      };

      const fakeInteraction = {
        client,

        commandName:
          command.data.name,

        guild: message.guild,

        guildId:
          message.guild.id,

        member:
          message.member,

        user:
          message.author,

        channel:
          message.channel,

        channelId:
          message.channel.id,

        deferred: false,

        replied: false,

        options: {
          getUser: () =>
            message.mentions.users.first(),

          getMember: () =>
            message.mentions.members.first(),

          getString: optionName => {
            if (
              optionName === "reason"
            ) {
              return (
                reasonArgs.join(" ") ||
                null
              );
            }

            return (
              args.join(" ") ||
              null
            );
          },

          getInteger: () =>
            firstNumber
              ? Number(firstNumber)
              : null,

          getNumber: () =>
            firstNumber
              ? Number(firstNumber)
              : null,

          getBoolean: () =>
            false,

          getChannel: () =>
            message.mentions.channels.first(),

          getRole: () =>
            message.mentions.roles.first(),

          getMentionable: () =>
            message.mentions.members.first() ||
            message.mentions.roles.first(),

          getSubcommand: () =>
            args[0] || null
        },

        reply: async data => {
          fakeInteraction.replied = true;

          return message.reply(
            normalizeReply(data)
          );
        },

        deferReply: async () => {
          fakeInteraction.deferred = true;
        },

        editReply: async data => {
          fakeInteraction.replied = true;

          return message.reply(
            normalizeReply(data)
          );
        },

        followUp: async data => {
          return message.reply(
            normalizeReply(data)
          );
        }
      };

      await command.execute(
        fakeInteraction,
        client
      );

    } catch (error) {
      console.error(
        "❌ Prefix command error:",
        error
      );

      await message
        .reply(
          "❌ Prefix command failed."
        )
        .catch(() => {});
    }
  }
);
/* =========================================================
PROCESS ERRORS
========================================================= */

process.on(
"unhandledRejection",

error => {
console.error(
"❌ Unhandled rejection:",
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

/* =========================================================
START RUDRA
========================================================= */

async function startRudra() {
try {
if (
!process.env.TOKEN
) {
throw new Error(
"TOKEN is missing"
);
}

if (  
  !process.env.CLIENT_ID  
) {  
  throw new Error(  
    "CLIENT_ID is missing"  
  );  
}  

if (  
  !process.env.MONGODB_URI  
) {  
  throw new Error(  
    "MONGODB_URI is missing"  
  );  
}  

await mongoose.connect(  
  process.env.MONGODB_URI  
);  

console.log(  
  "✅ MongoDB Connected"  
);  

app.listen(  
  PORT,  

  () => {  
    console.log(  
      `🚀 RUDRA server running on port ${PORT}`  
    );  
  }  
);  

await client.login(  
  process.env.TOKEN  
);

} catch (error) {
console.error(
"❌ RUDRA startup failed:",
error
);

process.exit(1);

}
}

startRudra();
