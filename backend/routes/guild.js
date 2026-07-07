const express = require("express");
const router = express.Router();

const GuildSettings = require("../models/GuildSettings");

module.exports = () => {

  router.get("/:guildId", async (req, res) => {
    try {
      let settings = await GuildSettings.findOne({
        guildId: req.params.guildId
      });

      if (!settings) {
        settings = await GuildSettings.create({
          guildId: req.params.guildId
        });
      }

      res.json({
        success: true,
        settings
      });

    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message: "Internal Server Error"
      });
    }
  });

  return router;
};