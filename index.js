import http from "http";

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";

import P from "pino";

// Render PORT
const PORT = process.env.PORT || 3000;

// Web server එක මුලින්ම start කරන්න
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("HASA-MD Bot is running!");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./auth_info");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("🤖 HASA-MD BOT CONNECTED!");
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      if (shouldReconnect) {
        startBot();
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg?.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (text.toLowerCase() === "hi") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "👋 Hello! I'm HASA-MD Bot 🤖"
      });
    }
  });
}

startBot();
