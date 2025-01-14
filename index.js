const handler = require("./handler.js");
const helper = require("chatbot/helper");
const config = require("./config/config.json");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const P = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const { termBot } = require("./lib/terminal.js");
require("dotenv").config();

const argv = process.argv[2];

// Fungsi utama untuk menghubungkan ke WhatsApp
async function connectToWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const socket = makeWASocket({
      auth: state,
      logger: P({ level: "silent" }),
      browser: ["Baileys", "Safari", "3.0"],
    });

    // Event untuk menyimpan kredensial
    socket.ev.on("creds.update", saveCreds);

    // Event untuk memantau status koneksi
    socket.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === "close") {
        const shouldReconnect =
          new Boom(lastDisconnect?.error)?.output?.statusCode !==
          DisconnectReason.loggedOut;
        console.log("Koneksi terputus. Reconnecting:", shouldReconnect);

        if (shouldReconnect) {
          connectToWhatsApp();
        } else {
          console.log("Anda telah logout. Silakan login kembali.");
        }
      } else if (connection === "open") {
        console.log("Bot WhatsApp berhasil terhubung!");
        socket.updateProfileStatus("Bot aktif");
        if (argv === "terminalbot") {
          termBot(socket);
        }
      }
    });

    // Event ketika menerima pesan
    socket.ev.on("messages.upsert", async ({ messages, type }) => {
      const message = messages[0];

      // Abaikan pesan dari bot sendiri atau pesan grup
      if (!message.message || message.key.fromMe || message.key.remoteJid.endsWith("@g.us")) {
        return;
      }

      const text = message.message.conversation?.trim();
      if (!text) return;

      console.log("Pesan diterima:", text);

      // Ambil perintah
      const command = text.split(" ")[0];
      const args = text.split(" ").slice(1);

      // Handler berdasarkan perintah
      if (command === "panduan") {
        await handler.panduan(socket, message, helper.getCommandList());
      } else if (handler[command]) {
        await handler[command](socket, message, args);
      } else {
        socket.sendMessage(message.key.remoteJid, {
          text: `Perintah tidak dikenali. Ketik *panduan* untuk melihat daftar perintah.`,
        });
      }
    });
  } catch (err) {
    console.error("Error saat menghubungkan ke WhatsApp:", err.message);
  }
}

// Memulai koneksi
connectToWhatsApp();
