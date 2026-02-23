# TakTerkendalikhan - WhatsApp Bot

Bot WhatsApp otomatis menggunakan Baileys MOD dengan fitur anonymous chat dan berbagai perintah utility.

## 📋 Daftar Isi

- [Fitur](#fitur)
- [Requirement](#requirement)
- [Setup & Instalasi](#setup--instalasi)
- [Konfigurasi](#konfigurasi)
- [Penggunaan](#penggunaan)
- [Fitur Lengkap](#fitur-lengkap)
- [Troubleshooting](#troubleshooting)
- [Lisensi](#lisensi)

## ✨ Fitur

- ✅ **Login via QR Code** - Scan QR code di terminal untuk login
- ✅ **Session Management** - Credentials otomatis tersimpan
- ✅ **Anonymous Chat** - Chat dengan user lain secara anonim
- ✅ **Profile Picture Bot** - Set foto profil bot via command
- ✅ **Auto Reconnect** - Reconnect otomatis saat disconnect
- ✅ **Multi-Device Support** - Compatible dengan berbagai perangkat

## 📦 Requirement

- Node.js v18+ (direkomendasikan v20+)
- npm atau yarn
- Akun WhatsApp aktif
- Terminal/Console

## 🚀 Setup & Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/Riski1410/TakTerkendalikhan.git
cd TakTerkendalikhan
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi

Edit file `config.js`:

```javascript
export default {
  owner: 'Your-Number',  // Ganti dengan nomor WhatsApp owner
  }
};
```

### 4. Jalankan Bot

```bash
npm start
```

Bot akan menampilkan QR code di terminal. Scan dengan WhatsApp Anda untuk login.

## 🔧 Konfigurasi

### File `config.js`

```javascript
{
  owner: string,              // Nomor WhatsApp owner (format: 62xxxxxxxxxx)
  ptero: {
    url: string,             // URL Pterodactyl Panel
    apiKey: string           // API Key Pterodactyl
  }
}
```

### Environment Variables (Optional)

Buat file `.env`:

```env
OWNER_NUMBER=6289648388784
PTERO_URL=https://actualization.biz.id
PTERO_API_KEY=your-api-key
```

## 📱 Penggunaan

### 1. Login Pertama Kali

```bash
npm start
```

Akan muncul QR code di terminal:

```
╔════════════════════════════════════╗
║  Scan QR Code di bawah ini dengan  ║
║  WhatsApp Anda untuk terkoneksi    ║
╚════════════════════════════════════╝

[QR CODE DITAMPILKAN DI SINI]
```

Scan dengan WhatsApp → Linked Devices → Link a Device

### 2. Login Berikutnya

Session sudah tersimpan di folder `./session/`, jadi tidak perlu scan ulang:

```bash
npm start
```

Bot akan langsung terhubung.

### 3. Command Bot

#### Anonymous Chat

- **Buka Menu**: Kirim `.anon`
- **Start Chat**: Tekan tombol "Start Anon Chat"
- **Stop Chat**: Tekan tombol "Stop Anon Chat"

#### Set Profile Picture

- **Command**: Reply foto dengan caption `.setppbot`
- **Contoh**: Kirim foto → Reply dengan `.setppbot`
- Bot akan mengubah profile picture-nya

## 🎯 Fitur Lengkap

### Connection Events

| Event | Keterangan |
|-------|-----------|
| `connection.update` | Update status koneksi (connecting/open/close) |
| `creds.update` | Update & simpan credentials otomatis |
| `messages.upsert` | Terima pesan masuk |

### Handler Messages

| Trigger | Fungsi | Contoh |
|---------|--------|--------|
| `.anon` | Buka anonymous chat menu | Kirim `.anon` |
| `.setppbot` | Set profile picture bot | Reply foto + `.setppbot` |
| Button response | Handle button clicks | Pilih button di menu |

### Connection Status

```
[⟳ Menghubungkan...] - Sedang terhubung ke WhatsApp
[✓ Terhubung] - Bot berhasil terhubung
[❌ Koneksi Terputus] - Koneksi putus, mencoba reconnect
[❌ Logout] - Bot di-logout, hapus session untuk login ulang
```

## 📁 Struktur Project

```
TakTerkendalikhan/
├── index.js                 # Main bot logic
├── config.js               # Konfigurasi
├── package.json            # Dependencies
├── .gitignore             # Git ignore rules
├── README.md              # Dokumentasi (file ini)
└── session/               # Folder session (auto-created)
    ├── creds.json
    ├── pre-keys/
    ├── session-xxx/
    └── sig-keys/
```

## 🔐 Session Management

### Menyimpan Session

Session otomatis tersimpan di folder `./session/`:

```
session/
├── creds.json              # Credentials WhatsApp
├── pre-keys/               # Pre-keys encryption
├── session-xxxxx/          # Session data
└── sig-keys.json           # Signature keys
```

### Reset Session

Untuk login ulang (logout):

```bash
rm -rf session/
npm start
```

Kemudian scan QR code lagi.

## 🐛 Troubleshooting

### QR Code Tidak Terlihat

1. Scroll ke atas di terminal
2. Resize terminal agar lebih lebar (minimal 50 karakter)
3. Hapus session dan jalankan ulang:
   ```bash
   rm -rf session/
   npm start
   ```

### Bot Terus Reconnect

**Penyebab**: Koneksi internet terputus atau WhatsApp di HP disconnect

**Solusi**:
1. Pastikan koneksi internet stabil
2. Pastikan WhatsApp di HP terhubung internet
3. Coba logout dan login ulang:
   ```bash
   rm -rf session/
   npm start
   ```

### Session Tidak Tersimpan

**Penyebab**: Permission folder `session/` bermasalah

**Solusi**:
```bash
# Cek permission
ls -la session/

# Jika error, hapus dan buat ulang
rm -rf session/
npm start
```

### Port Conflict

Jika ada error port, cek apakah ada process bot lain:

```bash
# Linux/Mac
lsof -i :3000

# Windows
netstat -ano | findstr :3000
```

### Dependency Error

Jika ada error saat install:

```bash
# Clear cache
npm cache clean --force

# Install ulang
rm -rf node_modules package-lock.json
npm install
```

## 📚 Dokumentasi Teknis

### Baileys MOD

Bot ini menggunakan [`@rexxhayanasi/elaina-baileys`](https://www.npmjs.com/package/@rexxhayanasi/elaina-baileys) - fork dari Baileys dengan improvement:

- Better stability
- Improved QR code handling
- Better message handling
- Enhanced reconnection logic

### Dependencies

```json
{
  "@rexxhayanasi/elaina-baileys": "latest",  // Baileys MOD
  "@hapi/boom": "^10.0.1",                    // Error handling
  "qrcode-terminal": "^0.12.0",              // QR code di terminal
  "chalk": "^5.4.1",                         // Colored terminal text
  "pino": "^9.7.0",                          // Logger
  "jimp": "^0.22.10",                        // Image processing
  "cheerio": "^1.1.0"                        // HTML parsing
}
```

## 🔗 Link Penting

- [Baileys GitHub](https://github.com/WhiskeySockets/Baileys)
- [Elaina Baileys NPM](https://www.npmjs.com/package/@rexxhayanasi/elaina-baileys)
- [WhatsApp Web](https://web.whatsapp.com)

## 📝 Notes

- ⚠️ **Gunakan dengan bijak** - Jangan spam atau abuse bot
- 🔒 **Jangan share credentials** - Simpan `config.js` dengan aman
- 🚫 **Jangan gunakan di production** jika belum siap
- 📱 **Satu session per device** - Session hanya untuk satu perangkat

## 🤝 Kontribusi

Untuk berkontribusi:

1. Fork repository ini
2. Buat branch baru: `git checkout -b feature/nama-fitur`
3. Commit changes: `git commit -m "Add: deskripsi perubahan"`
4. Push ke branch: `git push origin feature/nama-fitur`
5. Buat Pull Request

## 📄 Lisensi

Project ini menggunakan lisensi MIT. Lihat file `LICENSE` untuk detail.

## 👨‍💻 Author

- **Repository Owner**: [Riski1410](https://github.com/Riski1410)
- **Baileys MOD**: [@RexxHayanasi](https://www.npmjs.com/package/@rexxhayanasi/elaina-baileys)

## 📞 Support

Jika ada pertanyaan atau issue:

1. Buat [GitHub Issue](https://github.com/Riski1410/TakTerkendalikhan/issues)
2. Sertakan error message lengkap
3. Jelaskan apa yang sudah Anda coba

---

**Last Updated**: February 23, 2026  
**Version**: 1.0.0
