import { makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } from '@rexxhayanasi/elaina-baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import chalk from 'chalk';
import config from './config.js';

// Anonymous chat state
const waitingAnon = new Set();
const anonPartners = new Map();

// Store untuk messages (untuk getMessage function)
const messageStore = new Map();

async function startBot() {
  const logger = pino({ level: 'error' });
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const myJid = state.creds.me?.id;
  
  // getMessage function - penting untuk resend messages dan decrypt poll votes
  const getMessage = async (key) => {
    if (messageStore.has(key.id)) {
      return messageStore.get(key.id);
    }
    return proto.WebMessageInfo.fromObject({
      key,
      message: proto.Message.fromObject({})
    });
  };

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger,
    browser: ['Ubuntu', 'Chrome', '120.0.0.0'],
    // Jangan set online status saat connect (agar tetap dapat notifikasi)
    markOnlineOnConnect: false,
    // Function untuk retrieve messages
    getMessage,
    // Uncomment jika ingin emulate desktop (sync full history)
    // syncFullHistory: false,
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update;
    
    // Handle QR Code
    if (qr) {
      console.log(chalk.cyan('\n╔════════════════════════════════════╗'));
      console.log(chalk.cyan('║  Scan QR Code di bawah ini dengan  ║'));
      console.log(chalk.cyan('║  WhatsApp Anda untuk terkoneksi    ║'));
      console.log(chalk.cyan('╚════════════════════════════════════╝\n'));
      qrcode.generate(qr, { small: true, width: 3 });
      console.log(chalk.yellow('\n→ Jika QR tidak terlihat, coba scroll ke atas\n'));
    }
    
    // Handle connection status
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      
      // Jika disconnect karena restart required, buat socket baru
      if (statusCode === DisconnectReason.restartRequired) {
        console.log(chalk.yellow('[⟳ Restart Required]'), 'Membuat connection baru...');
        setTimeout(() => startBot(), 3000);
      }
      // Jika normal disconnect (bukan logout)
      else if (statusCode !== DisconnectReason.loggedOut) {
        console.log(chalk.red('[❌ Koneksi Terputus]'), 'Mencoba reconnect...');
        setTimeout(() => startBot(), 3000);
      } 
      // Jika user logout
      else {
        console.log(chalk.red('[❌ Logout]'), 'Bot di-logout. Hapus folder session untuk login ulang.');
      }
    } else if (connection === 'open') {
      console.log(chalk.green('[✓ Terhubung]'), 'Bot berhasil connect ke WhatsApp!');
    } else if (connection === 'connecting') {
      console.log(chalk.blue('[⟳ Menghubungkan...]'), 'Sedang terhubung ke WhatsApp...');
    }
  });


  // Simpan credentials setiap kali ada update
  sock.ev.on('creds.update', saveCreds);

  // Handle incoming messages
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (!messages || !messages[0]) return;
    
    // Store messages untuk getMessage function
    for (const msg of messages) {
      messageStore.set(msg.key.id, msg);
    }
    
    try {
      const msg = messages[0];
    if (msg.key.fromMe) return;
    const sender = msg.key.remoteJid;
    // Button-based anon interactions
    const btnResp = msg.message?.buttonsResponseMessage;
    if (btnResp) {
      const btn = btnResp.selectedButtonId;
      if (btn === 'anon_start') {
        // start anon chat
        if (anonPartners.has(sender)) {
          await sock.sendMessage(sender, { text: 'Anda sudah dalam chat anonim.' });
        } else if (waitingAnon.size) {
          const partner = waitingAnon.values().next().value;
          waitingAnon.delete(partner);
          anonPartners.set(sender, partner);
          anonPartners.set(partner, sender);
          await sock.sendMessage(sender, { text: 'Terhubung dengan partner anonim!' });
          await sock.sendMessage(partner, { text: 'Terhubung dengan partner anonim!' });
        } else {
          waitingAnon.add(sender);
          await sock.sendMessage(sender, { text: 'Menunggu partner anonim...' });
        }
        return;
      }
      if (btn === 'anon_stop') {
        // stop anon chat
        if (anonPartners.has(sender)) {
          const partner = anonPartners.get(sender);
          anonPartners.delete(sender);
          anonPartners.delete(partner);
          await sock.sendMessage(sender, { text: 'Chat anonim dihentikan.' });
          await sock.sendMessage(partner, { text: 'Partner menghentikan chat anonim.' });
        } else if (waitingAnon.has(sender)) {
          waitingAnon.delete(sender);
          await sock.sendMessage(sender, { text: 'Anda berhenti menunggu partner anonim.' });
        } else {
          await sock.sendMessage(sender, { text: 'Anda tidak dalam chat anonim.' });
        }
        return;
      }
    }
    // Relay messages in anon chat
    if (anonPartners.has(sender)) {
      const relayText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
      if (relayText) {
        const partner = anonPartners.get(sender);
        await sock.sendMessage(partner, { text: relayText });
        return;
      }
    }
    // Trigger anon menu via 'anon' keyword
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    if (text.trim().toLowerCase() === '.anon') {
      // build buttons based on state
      const buttons = [{ buttonId: 'anon_start', buttonText: { displayText: 'Start Anon Chat' }, type: 1 }];
      if (waitingAnon.has(sender) || anonPartners.has(sender)) {
        buttons.push({ buttonId: 'anon_stop', buttonText: { displayText: 'Stop Anon Chat' }, type: 1 });
      }
      await sock.sendMessage(sender, {
        text: 'Anonymous Chat',
        footer: 'Pilih aksi:',
        buttons,
        headerType: 1
      });
      return;
    }
    const isOwner = (() => {
      const jidNumber = msg.key.participant ? msg.key.participant.replace(/\D/g, '') : sender.replace(/\D/g, '');
      return jidNumber === config.owner;
    })();
    
    // handle setppbot
    let media = null;
    let caption = '';
    if (msg.message?.imageMessage) {
      caption = msg.message.imageMessage.caption || '';
      media = msg;
    } else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
      caption = msg.message.extendedTextMessage.text || '';
      const ctx = msg.message.extendedTextMessage.contextInfo;
      media = { key: { ...msg.key, id: ctx.stanzaId, fromMe: false, participant: ctx.participant }, message: ctx.quotedMessage };
    }
    if (media && caption.trim().toLowerCase() === '.setppbot') {
      try {
        const buffer = await downloadMediaMessage(media, 'buffer', { unsafeMime: true });
        await sock.updateProfilePicture(myJid, buffer);
        await sock.sendMessage(sender, { text: 'Profil picture updated.' });
      } catch (e) {
        console.error('[SETPPBOT ERROR]', e);
        await sock.sendMessage(sender, { text: 'Gagal update foto profil.' });
      }
    }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
}

startBot();
