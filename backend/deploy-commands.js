require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");

const commands = [];

const commandsPath = path.join(__dirname, "commands");
const folders = fs.readdirSync(commandsPath);

for (const folder of folders) {
  const folderPath = path.join(commandsPath, folder);
  const files = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));

  for (const file of files) {
    const command = require(path.join(folderPath, file));
    if (command.data) {
      commands.push(command.data.toJSON());
    }
  }
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`🚀 Registering ${commands.length} slash command(s)...`);

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Slash commands registered successfully!");
  } catch (error) {
    console.error(error);
  }
})();