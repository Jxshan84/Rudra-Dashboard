const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType
} = require("discord.js");

module.exports = {

  data: new SlashCommandBuilder()

    .setName("record")

    .setDescription(
      "Voice recording system"
    )

    .addSubcommand(sub =>
      sub

        .setName("start")

        .setDescription(
          "Start recording"
        )
    )

    .addSubcommand(sub =>
      sub

        .setName("stop")

        .setDescription(
          "Stop recording"
        )
    )

    .addSubcommand(sub =>
      sub

        .setName("status")

        .setDescription(
          "Check recording status"
        )
    ),

  async execute(interaction) {

    const sub =
      interaction.options.getSubcommand();

    if (sub === "start") {

      const voice =
        interaction.member.voice.channel;

      if (!voice) {

        return interaction.reply({

          content:
            "❌ Join a voice channel first.",

          ephemeral: true

        });

      }

      const embed =
        new EmbedBuilder()

          .setColor("Red")

          .setTitle(
            "🎙️ Recording Started"
          )

          .setDescription(

            `Recording started in ${voice}.`

          )

          .addFields(

            {
              name: "Started By",
              value:
                `${interaction.user}`,
              inline: true
            },

            {
              name: "Channel",
              value:
                voice.name,
              inline: true
            }

          )

          .setTimestamp();

      return interaction.reply({

        embeds: [embed]

      });

    }

    if (sub === "stop") {

      return interaction.reply({

        content:
          "⏹️ Recording stopped."

      });

    }

    if (sub === "status") {

      return interaction.reply({

        content:
          "🎙️ No active recording."

      });

    }

  }

};