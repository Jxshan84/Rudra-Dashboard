const express = require("express");

module.exports = (client) => {

const router = express.Router();

// OWNER ID
const OWNER_ID = process.env.OWNER_ID;

// Get All Servers
router.get("/servers", async (req, res) => {

try {

const guilds = client.guilds.cache.map(guild => ({
id: guild.id,
name: guild.name,
icon: guild.iconURL({ dynamic: true }),
members: guild.memberCount,
ownerId: guild.ownerId
}));

res.json({
success: true,
total: guilds.length,
guilds
});

} catch (err) {

console.error(err);

res.status(500).json({
success: false,
message: "Failed to fetch servers."
});

}

});

// Get Single Server
router.get("/server/:id", async (req, res) => {

try {

const guild = client.guilds.cache.get(req.params.id);

if (!guild) {
return res.status(404).json({
success: false,
message: "Server not found."
});
}

res.json({
success: true,
server: {
id: guild.id,
name: guild.name,
icon: guild.iconURL({ dynamic: true }),
members: guild.memberCount,
ownerId: guild.ownerId
}
});

} catch (err) {

console.error(err);

res.status(500).json({
success: false
});

}

});

return router;

};