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
  AudioPlayerStatus
} = require("@discordjs/voice");

const prism = require("prism-media");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { pipeline } = require("stream/promises");

const activeRecordings = new Map();

const SAMPLE_RATE = 48000;
const CHANNELS = 2;
const BIT_DEPTH = 16;

/* =========================================================
   PATHS
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