const express = require("express");
const router = express.Router();

module.exports = (client) => {
  router.get("/stats", async (req, res) => {
    res.json({
      success: true,
      bot: {
        name: client.user?.username || "Starting...",
        tag: client.user?.tag || "Starting...",
        id: client.user?.id || null,
        status: client.isReady() ? "Online" : "Offline",
        ping: client.ws.ping,
        uptime: process.uptime(),
        servers: client.guilds.cache.size,
        users: client.guilds.cache.reduce(
          (a, g) => a + (g.memberCount || 0),
          0
        ),
        commands: client.commands?.size || 0,
        ram: Math.round(process.memoryUsage().rss / 1024 / 1024),
        node: process.version
      }
    });
  });

  return router;
};