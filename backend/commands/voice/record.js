const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const {
  joinVoiceChannel,
  entersState,
  VoiceConnectionStatus,
  EndBehaviorType,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  NoSubscriberBehavior
} = require("@discordjs/voice");

const prism = require("prism-media");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { pipeline } = require("stream/promises");

/* =========================================================
   ACTIVE RECORDINGS
========================================================= */

const activeRecordings = new Map();

const SAMPLE_RATE = 48000;
const CHANNELS = 2;
const BIT_DEPTH = 16;

const SILENCE_LIMIT_SECONDS = 20;
const SILENCE_ALERT_COOLDOWN = 20_000;

/* =========================================================
   ASSET PATHS
========================================================= */

const assetsFolder = path.join(
  __dirname,
  "../../assets"
);

const nowRecordingAudio = path.join(
  assetsFolder,
  "now-recording.mp3"
);

const recordingStoppedAudio = path.join(
  assetsFolder,
  "recording-stopped.mp3"
);

/* =========================================================
   BASIC HELPERS
========================================================= */

function createRecordingId() {
  return crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase();
}

function safeFileName(name) {
  return String(name || "user")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 40);
}

function createRecordingFolder(
  guildId,
  recordingId
) {
  const folder = path.join(
    process.cwd(),
    "recordings",
    guildId,
    recordingId
  );

  fs.mkdirSync(folder, {
    recursive: true
  });

  return folder;
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.max(
    0,
    Math.floor(milliseconds / 1000)
  );

  const hours = Math.floor(
    totalSeconds / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map(value =>
      String(value).padStart(2, "0")
    )
    .join(":");
}

/* =========================================================
   SEND MESSAGE IN VC CHAT
========================================================= */

async function sendVoiceChannelMessage(
  session,
  content
) {
  try {
    const voiceChannel =
      session.guild.channels.cache.get(
        session.channelId
      );

    if (
      voiceChannel &&
      typeof voiceChannel.send === "function"
    ) {
      return await voiceChannel.send({
        content
      });
    }

    if (
      session.commandChannel &&
      typeof session.commandChannel.send ===
        "function"
    ) {
      return await session.commandChannel.send({
        content
      });
    }

    return null;
  } catch (error) {
    console.error(
      "Voice chat message error:",
      error.message
    );

    return null;
  }
}

/* =========================================================
   PLAY ANNOUNCEMENT
========================================================= */

async function playAnnouncement(
  connection,
  filePath
) {
  if (!fs.existsSync(filePath)) {
    console.log(
      `⚠️ Audio file missing: ${filePath}`
    );

    return false;
  }

  const player = createAudioPlayer({
    behaviors: {
      noSubscriber:
        NoSubscriberBehavior.Play
    }
  });

  const resource =
    createAudioResource(filePath);

  const subscription =
    connection.subscribe(player);

  if (!subscription) {
    console.log(
      "⚠️ Audio player subscription failed."
    );

    return false;
  }

  player.play(resource);

  await new Promise(resolve => {
    const timeout = setTimeout(
      resolve,
      15000
    );

    player.once(
      AudioPlayerStatus.Idle,
      () => {
        clearTimeout(timeout);
        resolve();
      }
    );

    player.once(
      "error",
      error => {
        clearTimeout(timeout);

        console.error(
          "Announcement error:",
          error.message
        );

        resolve();
      }
    );
  });

  player.stop(true);

  return true;
}

/* =========================================================
   BOT RECORDING NICKNAME
========================================================= */

async function setRecordingNickname(
  guild,
  session
) {
  const botMember = guild.members.me;

  if (!botMember) return;

  session.originalNickname =
    botMember.nickname;

  await botMember
    .setNickname(
      "![RECORDING] RUDRA",
      "Voice recording started"
    )
    .catch(error => {
      console.log(
        "Nickname change failed:",
        error.message
      );
    });
}

async function restoreNickname(
  guild,
  session
) {
  const botMember = guild.members.me;

  if (!botMember) return;

  await botMember
    .setNickname(
      session.originalNickname || "RUDRA",
      "Voice recording stopped"
    )
    .catch(error => {
      console.log(
        "Nickname restore failed:",
        error.message
      );
    });
}

/* =========================================================
   WAV HEADER
========================================================= */

function createWavHeader(dataLength) {
  const header = Buffer.alloc(44);

  const blockAlign =
    CHANNELS * (BIT_DEPTH / 8);

  const byteRate =
    SAMPLE_RATE * blockAlign;

  header.write("RIFF", 0);

  header.writeUInt32LE(
    36 + dataLength,
    4
  );

  header.write("WAVE", 8);
  header.write("fmt ", 12);

  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(CHANNELS, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(BIT_DEPTH, 34);

  header.write("data", 36);

  header.writeUInt32LE(
    dataLength,
    40
  );

  return header;
}

/* =========================================================
   PCM TO WAV
========================================================= */

async function convertPcmToWav(
  pcmPath,
  wavPath
) {
  if (!fs.existsSync(pcmPath)) {
    return false;
  }

  const stats =
    await fs.promises.stat(pcmPath);

  if (stats.size <= 0) {
    return false;
  }

  const output =
    fs.createWriteStream(wavPath);

  output.write(
    createWavHeader(stats.size)
  );

  await pipeline(
    fs.createReadStream(pcmPath),
    output
  );

  return true;
}
/* =========================================================
   RECORD USER AUDIO
========================================================= */

function recordUser(
  session,
  userId
) {
  if (
    session.recordingUsers.has(
      userId
    )
  ) {
    return;
  }

  const member =
    session.guild.members.cache.get(
      userId
    );

  if (
    !member ||
    member.user.bot
  ) {
    return;
  }

  session.recordingUsers.add(
    userId
  );

  session.lastVoiceTime =
    Date.now();

  const username =
    safeFileName(
      member.user.username
    );

  const pcmFile =
    path.join(
      session.folder,
      `${username}-${userId}.pcm`
    );

  const wavFile =
    path.join(
      session.folder,
      `${username}-${userId}.wav`
    );

  session.files.set(
    userId,
    {
      username,
      pcmFile,
      wavFile
    }
  );

  const opusStream =
    session.connection.receiver.subscribe(
      userId,
      {
        end: {
          behavior:
            EndBehaviorType.AfterSilence,

          duration: 1000
        }
      }
    );

  const decoder =
    new prism.opus.Decoder({
      rate: SAMPLE_RATE,
      channels: CHANNELS,
      frameSize: 960
    });

  const output =
    fs.createWriteStream(
      pcmFile,
      {
        flags: "a"
      }
    );

  opusStream
    .pipe(decoder)
    .pipe(output);

  opusStream.on(
    "end",
    () => {
      session.recordingUsers.delete(
        userId
      );
    }
  );

  opusStream.on(
    "error",
    () => {
      session.recordingUsers.delete(
        userId
      );
    }
  );
}

/* =========================================================
   SILENCE WATCHER
========================================================= */

function startSilenceWatcher(
  session
) {
  session.lastVoiceTime =
    Date.now();

  session.lastAlert = 0;

  session.silenceInterval =
    setInterval(
      async () => {
        const voiceChannel =
          session.guild.channels.cache.get(
            session.channelId
          );

        if (
          !voiceChannel
        ) {
          return;
        }

        const humans =
          voiceChannel.members.filter(
            member =>
              !member.user.bot
          );

        const seconds =
          Math.floor(
            (
              Date.now() -
              session.lastVoiceTime
            ) / 1000
          );

        if (
          seconds <
          SILENCE_LIMIT_SECONDS
        ) {
          return;
        }

        if (
          Date.now() -
            session.lastAlert <
          SILENCE_ALERT_COOLDOWN
        ) {
          return;
        }

        session.lastAlert =
          Date.now();

        if (
          humans.size === 0
        ) {
          await sendVoiceChannelMessage(
            session,
            `⚠️ Nobody is in the voice channel since **${seconds} seconds**.`
          );

          return;
        }

        await sendVoiceChannelMessage(
          session,
          `🔇 I can't hear any voice since **${seconds} seconds**.`
        );
      },

      10000
    );
}
/* =========================================================
   CRAIG-STYLE RECORDING PANEL
========================================================= */

function createPanelEmbed(
  session,
  stopped = false
) {
  const duration = formatDuration(
    Date.now() - session.startedAt
  );

  const embed = new EmbedBuilder()
    .setColor(
      stopped
        ? 0xff3030
        : 0x23d18b
    )
    .setTitle(
      stopped
        ? "⏹️ Recording Stopped"
        : "🔴 Now Recording"
    )
    .setDescription(
      stopped
        ? "Voice recording has ended."
        : "RUDRA is recording this voice channel. Everyone must be informed."
    )
    .addFields(
      {
        name: "Recording ID",
        value: `\`${session.recordingId}\``,
        inline: true
      },
      {
        name: "Voice Channel",
        value: `<#${session.channelId}>`,
        inline: true
      },
      {
        name: "Duration",
        value: duration,
        inline: true
      },
      {
        name: "Started By",
        value: `<@${session.startedBy}>`,
        inline: true
      },
      {
        name: "Recorded Users",
        value: `${session.files.size}`,
        inline: true
      },
      {
        name: "Controls",
        value: session.locked
          ? "🔒 Locked"
          : "🔓 Unlocked",
        inline: true
      }
    )
    .setFooter({
      text: "Powered by RUDRA"
    })
    .setTimestamp();

  if (session.notes.length > 0) {
    embed.addFields({
      name: "📝 Notes",
      value: session.notes
        .slice(-5)
        .map(note => `• ${note}`)
        .join("\n")
        .slice(0, 1024)
    });
  }

  return embed;
}

function createPanelButtons(
  session,
  disabled = false
) {
  const stopButton =
    new ButtonBuilder()
      .setCustomId(
        `record_stop_${session.recordingId}`
      )
      .setLabel("Stop Recording")
      .setEmoji("⏹️")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled);

  const noteButton =
    new ButtonBuilder()
      .setCustomId(
        `record_note_${session.recordingId}`
      )
      .setLabel("Add Note")
      .setEmoji("📝")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(
        disabled || session.locked
      );

  const lockButton =
    new ButtonBuilder()
      .setCustomId(
        `record_lock_${session.recordingId}`
      )
      .setLabel(
        session.locked
          ? "Unlock"
          : "Lock"
      )
      .setEmoji(
        session.locked
          ? "🔓"
          : "🔒"
      )
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled);

  return new ActionRowBuilder()
    .addComponents(
      stopButton,
      noteButton,
      lockButton
    );
}

/* =========================================================
   FINISH RECORDING
========================================================= */

async function finishRecording(guildId) {
  const session =
    activeRecordings.get(guildId);

  if (!session) {
    return null;
  }

  session.stopping = true;

  clearInterval(
    session.silenceInterval
  );

  clearInterval(
    session.panelInterval
  );

  session.connection.receiver.speaking
    .removeAllListeners("start");

  await playAnnouncement(
    session.connection,
    recordingStoppedAudio
  ).catch(() => {});

  try {
    session.connection.destroy();
  } catch {}

  await restoreNickname(
    session.guild,
    session
  );

  activeRecordings.delete(guildId);

  await new Promise(resolve =>
    setTimeout(resolve, 1000)
  );

  const uploadedFiles = [];

  for (
    const fileData
    of session.files.values()
  ) {
    try {
      const converted =
        await convertPcmToWav(
          fileData.pcmFile,
          fileData.wavFile
        );

      if (!converted) {
        continue;
      }

      const stats =
        await fs.promises.stat(
          fileData.wavFile
        );

      if (stats.size > 44) {
        uploadedFiles.push({
          attachment:
            fileData.wavFile,

          name:
            path.basename(
              fileData.wavFile
            )
        });
      }

      await fs.promises.unlink(
        fileData.pcmFile
      ).catch(() => {});
    } catch (error) {
      console.error(
        "WAV conversion error:",
        error.message
      );
    }
  }

  return {
    ...session,
    uploadedFiles
  };
}
/* =========================================================
   STOP SESSION
========================================================= */

async function stopSession(
  interaction,
  session
) {
  if (session.stopping) {
    return interaction.reply({
      content:
        "⚠️ Recording is already stopping.",
      ephemeral: true
    }).catch(() => {});
  }

  await interaction.deferReply({
    ephemeral: true
  });

  const result =
    await finishRecording(
      interaction.guild.id
    );

  if (!result) {
    return interaction.editReply(
      "❌ Recording session not found."
    );
  }

  if (result.panelMessage) {
    await result.panelMessage.edit({
      embeds: [
        createPanelEmbed(
          result,
          true
        )
      ],

      components: [
        createPanelButtons(
          result,
          true
        )
      ]
    }).catch(() => {});
  }

  if (
    !result.uploadedFiles ||
    result.uploadedFiles.length === 0
  ) {
    return interaction.editReply(
      "⚠️ Recording stopped, but no audio was captured."
    );
  }

  try {
    await interaction.channel.send({
      content:
        `✅ **Recording Completed**\n` +
        `🆔 Recording ID: \`${result.recordingId}\`\n` +
        `🎙️ Channel: <#${result.channelId}>\n` +
        `👥 Files: ${result.uploadedFiles.length}`,

      files:
        result.uploadedFiles.slice(
          0,
          10
        )
    });

    return interaction.editReply(
      "✅ Recording stopped successfully."
    );
  } catch (error) {
    console.error(
      "Upload error:",
      error
    );

    return interaction.editReply(
      "⚠️ Recording saved but upload failed."
    );
  }
}
module.exports = {
  data: new SlashCommandBuilder()
    .setName("record")
    .setDescription("Craig-style voice recorder")

    .addSubcommand(sub =>
      sub
        .setName("start")
        .setDescription(
          "Start voice recording in your current voice channel."
        )
    )

    .addSubcommand(sub =>
      sub
        .setName("stop")
        .setDescription(
          "Stop the active recording session."
        )
    )

    .addSubcommand(sub =>
      sub
        .setName("status")
        .setDescription(
          "Check the current recording status."
        )
    ),

  async execute(interaction) {
    const sub =
      interaction.options.getSubcommand();

    /* ==========================
       START
    ========================== */

    if (sub === "start") {
      const member =
        interaction.member;

      const voiceChannel =
        member.voice.channel;

      if (!voiceChannel) {
        return interaction.reply({
          content:
            "❌ You must join a voice channel first.",
          ephemeral: true
        });
      }

      if (
        activeRecordings.has(
          interaction.guild.id
        )
      ) {
        return interaction.reply({
          content:
            "⚠️ A recording session is already running.",
          ephemeral: true
        });
      }

      await interaction.deferReply();

      const recordingId =
        createRecordingId();

      const folder =
        createRecordingFolder(
          interaction.guild.id,
          recordingId
        );

      const connection =
        joinVoiceChannel({
          channelId:
            voiceChannel.id,

          guildId:
            interaction.guild.id,

          adapterCreator:
            interaction.guild
              .voiceAdapterCreator,

          selfDeaf: false
        });

      await entersState(
        connection,
        VoiceConnectionStatus.Ready,
        20000
      );

      const session = {
        recordingId,
        guild: interaction.guild,
        channelId: voiceChannel.id,
        commandChannel:
          interaction.channel,

        connection,
        folder,

        startedBy:
          interaction.user.id,

        startedAt:
          Date.now(),

        notes: [],
        locked: false,

        files: new Map(),
        recordingUsers:
          new Set(),

        lastVoiceTime:
          Date.now()
      };

      activeRecordings.set(
        interaction.guild.id,
        session
      );

      await setRecordingNickname(
        interaction.guild,
        session
      );

      await playAnnouncement(
        connection,
        nowRecordingAudio
      );

      startSilenceWatcher(
        session
      );

      connection.receiver.speaking.on(
        "start",
        userId => {
          recordUser(
            session,
            userId
          );
        }
      );

      const panel =
        await interaction.editReply({
          embeds: [
            createPanelEmbed(
              session
            )
          ],

          components: [
            createPanelButtons(
              session
            )
          ]
        });

      session.panelMessage =
        panel;

      session.panelInterval =
        setInterval(() => {
          panel
            .edit({
              embeds: [
                createPanelEmbed(
                  session
                )
              ],

              components: [
                createPanelButtons(
                  session
                )
              ]
            })
            .catch(() => {});
        }, 15000);
    }

    /* ==========================
       STOP
    ========================== */

    if (sub === "stop") {
      const session =
        activeRecordings.get(
          interaction.guild.id
        );

      if (!session) {
        return interaction.reply({
          content:
            "❌ No recording session is currently active.",
          ephemeral: true
        });
      }

      return stopSession(
        interaction,
        session
      );
    }

    /* ==========================
       STATUS
    ========================== */

    if (sub === "status") {
      const session =
        activeRecordings.get(
          interaction.guild.id
        );

      if (!session) {
        return interaction.reply({
          content:
            "❌ No active recording session found.",
          ephemeral: true
        });
      }

      return interaction.reply({
        embeds: [
          createPanelEmbed(
            session
          )
        ],

        ephemeral: true
      });
    }
  }
};