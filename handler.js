const fs = require("fs");
const { ss } = require("./spreadsheet");

module.exports = {
  // Fungsi untuk menambahkan data ke spreadsheet
  async input(conn, msg, sheet, data) {
    if (!sheet || !data || data.length === 0) {
      conn.sendMessage(msg.key.remoteJid, {
        text: "Sheet atau data tidak valid. Harap periksa kembali.",
      });
      return;
    }

    try {
      const res = await ss.addData(`${sheet}!C2`, data);
      conn.sendMessage(msg.key.remoteJid, {
        text: `✅ ${res.statusText}: Data berhasil ditambahkan ke sheet "${sheet}".`,
      });
    } catch (err) {
      conn.sendMessage(msg.key.remoteJid, {
        text: `❌ Terjadi kesalahan: ${err.message}`,
      });
    }
  },

  // Fungsi untuk menampilkan data dari spreadsheet
  async info(conn, msg, sheet, filter) {
    if (!sheet) {
      conn.sendMessage(msg.key.remoteJid, {
        text: "❓ Info sheet tidak disediakan. Harap masukkan nama sheet.",
      });
      return;
    }

    try {
      const resultArr = await ss.getRows(sheet);
      if (!resultArr || resultArr.length === 0) {
        conn.sendMessage(msg.key.remoteJid, {
          text: `❌ Tidak ada data ditemukan di sheet "${sheet}".`,
        });
        return;
      }

      // Header diambil dari baris pertama
      const headers = resultArr[0];
      const dataRows = resultArr.slice(1);

      let filteredData = dataRows.map((row) => {
        const obj = {};
        headers.forEach((key, idx) => {
          obj[key] = row[idx] || "Tidak tersedia";
        });
        return obj;
      });

      // Filter data jika ada
      if (filter && filter.length > 0) {
        filteredData = filteredData.filter((row) =>
          filter.some((value) =>
            Object.values(row).some((field) =>
              String(field).toLowerCase().includes(value.toLowerCase())
            )
          )
        );
      }

      if (filteredData.length === 0) {
        conn.sendMessage(msg.key.remoteJid, {
          text: "❌ Tidak ada data yang sesuai dengan filter.",
        });
      } else {
        const response = filteredData
          .map(
            (row, idx) =>
              `(${idx + 1})\n${Object.entries(row)
                .map(([key, value]) => `*${key}*: ${value}`)
                .join("\n")}\n`
          )
          .join("\n=================\n");

        conn.sendMessage(msg.key.remoteJid, { text: response });
      }
    } catch (err) {
      conn.sendMessage(msg.key.remoteJid, {
        text: `❌ Terjadi kesalahan: ${err.message}`,
      });
    }
  },

  // Fungsi untuk memberikan panduan ke pengguna
  async panduan(conn, msg, commandList) {
    if (!commandList || commandList.length === 0) {
      conn.sendMessage(msg.key.remoteJid, {
        text: "❓ Tidak ada panduan tersedia saat ini.",
      });
      return;
    }

    const guide = commandList
      .map(
        ([command, description]) =>
          `🔹 *${command}*\n${description}\n----------------------`
      )
      .join("\n");

    const response = `📖 *Panduan Penggunaan Bot*\n\nBerikut ini adalah daftar perintah yang dapat Anda gunakan:\n\n${guide}`;
    conn.sendMessage(msg.key.remoteJid, { text: response });
  },
};
