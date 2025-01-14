const { Client } = require("whatsapp-web.js");
const { ss } = require("./spreadsheet");
const qrcode = require("qrcode-terminal");

const client = new Client();

// Menampilkan QR Code untuk autentikasi
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

// Konfirmasi bot siap digunakan
client.on("ready", () => {
  console.log("Bot siap digunakan!");
});

// Fungsi untuk mencari data berdasarkan kode
async function handleSearchCode(msg, code) {
  try {
    // Cari data berdasarkan kode (key) di kolom pertama
    const data = await ss.getDataByNama("Sheet1!A2:E", code);

    if (data) {
      // Format pesan balasan
      const response = `📋 *Detail Data untuk Kode*: ${code}\n\n${data[1]}\n${data[2]}\n${data[3]}`;
      msg.reply(response);
    } else {
      // Jika data tidak ditemukan
      msg.reply(`Kode ${code} tidak ditemukan di database.`);
    }
  } catch (err) {
    console.error("Error:", err.message);
    msg.reply("Terjadi kesalahan saat mencari data. Silakan coba lagi.");
  }
}

// Event ketika menerima pesan
client.on("message", async (msg) => {
  const text = msg.body.trim();

  // Perintah untuk mencari kode
  if (text.toLowerCase().startsWith("kode ")) {
    const code = text.split(" ")[1]; // Ambil kode setelah perintah
    await handleSearchCode(msg, code);
  } else if (text.toLowerCase() === "menu") {
    // Menampilkan menu
    msg.reply("Ketik 'kode <kode_sales>' untuk mencari informasi.");
  } else {
    // Balasan default
    msg.reply("Perintah tidak dikenali. Ketik 'menu' untuk bantuan.");
  }
});

// Inisialisasi bot
client.initialize();
