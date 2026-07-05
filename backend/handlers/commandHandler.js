const fs = require("fs");
const path = require("path");

module.exports = (client) => {
    client.commands = new Map();

    const commandsPath = path.join(__dirname, "../commands");

    if (!fs.existsSync(commandsPath)) {
        console.log("⚠️ Commands folder not found.");
        return;
    }

    const folders = fs.readdirSync(commandsPath);

    for (const folder of folders) {
        const folderPath = path.join(commandsPath, folder);

        if (!fs.lstatSync(folderPath).isDirectory()) continue;

        const files = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));

        for (const file of files) {
            const command = require(path.join(folderPath, file));

            if (!command.data || !command.execute) continue;

            client.commands.set(command.data.name, command);
        }
    }

    console.log(`✅ Loaded ${client.commands.size} commands.`);
};