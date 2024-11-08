require('./config')
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios')
const chalk = require("chalk");
const similarity = require('similarity');
const process = require('process');
const treeify = require('treeify');
const speed = require('performance-now')
const moment = require("moment-timezone")
const checkDiskSpace = require('check-disk-space').default;
const {
  getGroupAdmins,
  toRupiah,
  readTime,
  sleep,
  fetchJson,
  runtime,
  checkBandwidth,
  bytesToSize,
  formatSize
} = require("./lib/function");
const {
  quote
} = require('./lib/quote.js')
const availableLanguages = JSON.parse(fs.readFileSync('./database/kode-bahasa.json', 'utf8'));
const {
  DateTime
} = require('luxon');
const {
  addXp,
  getXpForLevel,
  getRank
} = require('./lib/leveling')
const {
  exec
} = require("child_process")
const {
  generateWAMessage,
  areJidsSameUser,
  proto,
  downloadContentFromMessage,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  generateWAMessageContent
} = require("@whiskeysockets/baileys")

module.exports = tiky = async (tiky, m, chatUpdate, store) => {
  try {
    const body = (m && m?.mtype) ? (
      m?.mtype === 'conversation' ? m?.message?.conversation:
      m?.mtype === 'imageMessage' ? m?.message?.imageMessage?.caption:
      m?.mtype === 'videoMessage' ? m?.message?.videoMessage?.caption:
      m?.mtype === 'extendedTextMessage' ? m?.message?.extendedTextMessage?.text:
      m?.mtype === 'buttonsResponseMessage' ? m?.message.buttonsResponseMessage.selectedButtonId:
      m?.mtype === 'listResponseMessage' ? m?.message?.listResponseMessage?.singleSelectReply?.selectedRowId:
      m?.mtype === 'interactiveResponseMessage' ? appenTextMessage(JSON.parse(m?.msg.nativeFlowResponseMessage.paramsJson).id, chatUpdate):
      m?.mtype === 'templateButtonReplyMessage' ? appenTextMessage(m?.msg.selectedId, chatUpdate):
      m?.mtype === 'messageContextInfo' ? (m?.message.buttonsResponseMessage?.selectedButtonId || m?.message.listResponseMessage?.singleSelectReply.selectedRowId || m?.text):
      ''
    ): '';
    async function appenTextMessage(text, chatUpdate) {
      let messages = await generateWAMessage(m?.chat, {
        text: text, mentions: m?.mentionedJid
      }, {
        userJid: tiky.user.id,
        quoted: m?.quoted && m?.quoted.fakeObj
      })
      messages.key.fromMe = areJidsSameUser(m?.sender, tiky.user.id)
      messages.key.id = m?.key.id
      messages.pushName = m?.pushName
      if (m?.isGroup) messages.participant = m?.sender
      let msg = {
        ...chatUpdate,
        messages: [proto.WebMessageInfo.fromObject(messages)],
        type: 'append'
      }
      tiky.ev.emit('messages.upsert', msg)}
    const bodyString = (typeof body === 'string') ? body: '';
    const budy = (m && typeof m?.text === 'string') ? m?.text: '';
    const prefix = bodyString.startsWith('.') ? '.': '';
    const isCmd = bodyString.startsWith(prefix);
    const command = isCmd ? bodyString.slice(prefix.length).trim().split(' ').shift().toLowerCase(): '';
    const args = bodyString.trim().split(/ +/).slice(1);
    const full_args = bodyString.replace(command, '').slice(1).trim();
    const pushname = m?.pushName || "No Name";
    const botNumber = await tiky.decodeJid(tiky.user.id);

    const newowner = JSON.parse(fs.readFileSync('./database/owner.json'))

    const isCreator = (m && m?.sender && [botNumber, ...newowner, ...global.owner].map(v => String(v).replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m?.sender)) || false;
    const prem = require("./lib/premium");

    let premium = JSON.parse(fs.readFileSync('./database/premium.json'));
    const isPrem = isCreator ? true: prem.checkPremiumUser(m.sender, premium)
    const isPrivate = m?.fromMe || m?.author == null;
    const itsMe = (m && m?.sender && m?.sender == botNumber) || false;
    const text = q = args.join(" ");
    const from = m.key.remoteJid
    const fatkuns = m && (m?.quoted || m);
    const quoted = (fatkuns?.mtype == 'buttonsMessage') ? fatkuns[Object.keys(fatkuns)[1]]:
    (fatkuns?.mtype == 'templateMessage') ? fatkuns.hydratedTemplate[Object.keys(fatkuns.hydratedTemplate)[1]]:
    (fatkuns?.mtype == 'product') ? fatkuns[Object.keys(fatkuns)[0]]:
    m?.quoted || m;
    const mime = ((quoted?.msg || quoted) || {}).mimetype || '';
    const qmsg = (quoted?.msg || quoted);
    const isMedia = /image|video|sticker|audio/.test(mime);
    //group
    const groupMetadata = m?.isGroup ? await tiky.groupMetadata(m?.chat).catch(e => {}): {};
    const groupName = m?.isGroup ? groupMetadata.subject || '': '';
    const participants = m?.isGroup ? await groupMetadata.participants || []: [];
    const groupAdmins = m?.isGroup ? await getGroupAdmins(participants) || []: [];
    const isBotAdmins = m?.isGroup ? groupAdmins.includes(botNumber): false;
    const isAdmins = m?.isGroup ? groupAdmins.includes(m?.sender): false;
    const groupOwner = m?.isGroup ? groupMetadata.owner || '': '';
    const isGroupOwner = m?.isGroup ? (groupOwner ? groupOwner: groupAdmins).includes(m?.sender): false;
    const isGroup = m.key.remoteJid.endsWith('@g.us')
    const sender = m.isGroup ? (m.key.participant ? m.key.participant: m.participant): m.key.remoteJid
    const antilink = JSON.parse(fs.readFileSync('./database/antilink.json'));
    const antibadword = JSON.parse(fs.readFileSync('./database/antibadword.json'));
    const badwordCount = JSON.parse(fs.readFileSync('./database/badwordCount.json'));
    const referralData = JSON.parse(fs.readFileSync('./database/referrals.json', 'utf-8'));
    const AntiBadWord = m.isGroup ? antibadword.includes(m.chat): false;
    const maxBadWords = 5;
    const AntiLink = m.isGroup ? antilink.includes(m.chat): false
    const senders = m.sender;
    const more = String.fromCharCode(8206);
    const readmore = more.repeat(4800)
    const time = moment(Date.now()).tz('Asia/Jakarta').locale('id').format('HH:mm:ss z')
    const tanggal2 = moment.tz('Asia/Jakarta').format('DD/MM/YY')
    const threshold = 0.02;
    const checkBadword = (budy) => {
      const badwordRegex = /\b(a*n*j+ing|4nj1ng|n+j+ing|b4bi|kont[o0]l|mem[e3]k|t[o0]l[o0]l|g[o0]bl[o0]k|k[o0]nt[o0]l|bngst|asu|kampret|bego|njin[kg])\b/i;
      return badwordRegex.test(budy);
    };

    const users = JSON.parse(fs.readFileSync('./database/user.json', 'utf8'));
    const limit = global.limit

    function isVerified(senders) {
      return users[senders] && users[senders].verified === true;
    }

    const contactOwner = {
      key: {
        fromMe: false,
        participant: '0@s.whatsapp.net',
        remoteJid: 'status@broadcast'
      },
      message: {
        contactMessage: {
          displayName: "ᴘᴀᴅɪʟᴅᴇᴠ",
          vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:WhatsApp\nORG:WhatsApp Official;\nEND:VCARD'
        }
      }
    };
    const reply = async(teks) => {
      tiky.sendMessage(m.chat, {
        document: fs.readFileSync("./package.json"),
        fileName: global.filename,
        fileLength: 99999999999999,
        mimetype: 'application/pdf',
        caption: teks,
        isForwarded: false,
        contextInfo: {
          mentionedJid: [m?.sender],
          externalAdReply: {
            title: global.botname,
            body: global.author,
            showAdAttribution: true,
            mediaType: 2,
            thumbnail: fs.readFileSync('./thumbnail/thumbnail.jpg'),
            sourceUrl: global.sourceurl
          }
        }
      }, {
        quoted: contactOwner, ephemeralExpiration: 86400
      });
    }
    function generateRandomSerialKey() {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let serialKey = '';
      for (let i = 0; i < 15; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        serialKey += characters[randomIndex];
      }
      return serialKey;
    }

    function handlerLimit(senders, status) {
      if (!users[senders]) {
        reply("User not found.");
        return;
      }

      if (status) {
        // Jika menang, tambah limit 1
        users[senders].limit += 2;
      } else {
        // Jika kalah, kurangi limit 2
        users[senders].limit -= 4;

        // Pastikan limit tidak kurang dari 0
        if (users[senders].limit < 0) {
          users[senders].limit = 0;
        }
      }

      // Simpan perubahan ke dalam user.json
      fs.writeFileSync('./database/user.json', JSON.stringify(users, null, 2));
    }
    function handlerPoint(senders, status) {
      if (!users[senders]) {
        reply("User not found.");
        return;
      }

      if (status) {
        // Jika menang, tambah limit 1
        users[senders].point += 50;
      } else {
        // Jika kalah, kurangi limit 2
        users[senders].point -= 15;

        // Pastikan limit tidak kurang dari 0
        if (users[senders].point < 0) {
          users[senders].point = 0;
        }
      }

      // Simpan perubahan ke dalam user.json
      fs.writeFileSync('./database/user.json', JSON.stringify(users, null, 2));
    }
    function addUser(senders) {
      // Cek jika pengguna sudah ada
      if (!users[senders]) {
        // Format tanggal menggunakan moment-timezone
        let formattedDate = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm');

        // Buat pengguna baru dengan serial key
        if (senders === '6285867760406@s.whatsapp.net') {
          // Jika owner, berikan limit, point, dan saldo tak terbatas
          users[senders] = {
            verified: false,
            serialKey: 'creator:SK-' + generateRandomSerialKey(),
            dateAdded: formattedDate,
            xp: 100000,
            level: 100,
            limit: 9999999999999999999999999999999999999999999,
            point: 9999999999999999999999999999999999999999999,
            saldo: 9999999999999999999999999999999999999999999,
            usedReferral: [],
          };
        } else if (prem.checkPremiumUser(senders, premium)) {
          // Jika user adalah premium
          users[senders] = {
            verified: false,
            serialKey: 'SK-' + generateRandomSerialKey(),
            dateAdded: formattedDate,
            xp: 0,
            level: 1,
            limit: limit.premium,
            // Limit untuk pengguna premium
            point: limit.point,
            // Point untuk pengguna premium
            saldo: limit.saldo,
            // Saldo untuk pengguna premium
            usedReferral: [],
          };
        } else {
          // Pengguna normal dengan limit dan point standar
          users[senders] = {
            verified: false,
            serialKey: 'SK-' + generateRandomSerialKey(),
            dateAdded: formattedDate,
            xp: 0,
            level: 1,
            limit: limit.user,
            // Limit untuk pengguna normal
            point: limit.point,
            // Point untuk pengguna normal
            saldo: limit.saldo,
            // Saldo untuk pengguna normal
            usedReferral: [],
          };
        }
        // Simpan data ke file JSON
        fs.writeFileSync('./database/user.json', JSON.stringify(users, null, 2));
      }
    }
    if (global.autoread) {
      tiky.readMessages([m.key])
    }
    function formatToIDR(number) {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0 // Menghilangkan angka di belakang koma
      }).format(number);
    }
    async function searchDuckDuckGo(text) {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(text)}&format=json&no_html=1&skip_disambig=1`;

      try {
        const {
          data
        } = await axios.get(url);

        const results = data.RelatedTopics.map((result) => ({
          name: result.Text,
          url: result.FirstURL
        }));

        return results;
      } catch (error) {
        console.error(error);
        return [];
      }
    }
    function checkLanguageAvailability(languageCode) {
      const foundLanguage = availableLanguages.find(
        (lang) => lang.code === languageCode.trim()
      );
      if (foundLanguage) {
        return true;
      } else {
        let languageTree = {};
        availableLanguages.forEach(lang => {
          languageTree[lang.code] = lang.bahasa;
        });

        reply(`Bahasa dengan kode '${languageCode}' tidak tersedia. List bahasa yang tersedia:\n\n` + treeify.asTree(languageTree, true));
        return false;
      }
    }
    async function translateText(inputText, lang) {
      const translateUrl = `https://api.nyxs.pw/tools/translate?text=${encodeURIComponent(inputText)}&to=${lang}`;

      try {
        const response = await axios.get(translateUrl);
        const data = response.data;

        if (data.status) {
          // Jika status true, tampilkan hasil terjemahan
          return reply(`Hasil Terjemahan:\n\n"${data.result}"`);
        }
      } catch (error) {
        console.error(error);
        return reply('Terjadi kesalahan saat melakukan terjemahan. Coba lagi nanti.');
      }
    }
    async function getLyrics(text) {
      const apiUrl = `https://api.nyxs.pw/tools/lirik?title=${encodeURIComponent(text)}`;

      try {
        // Melakukan request ke API menggunakan Axios
        const {
          data
        } = await axios.get(apiUrl);

        // Cek apakah statusnya true dan ambil result-nya
        if (data.status) {
          return data.result;
        } else {
          throw new Error('Lirik tidak ditemukan atau status false');
        }
      } catch (error) {
        console.error('Error fetching lyrics:', error.message);
        return 'Tidak dapat mengambil lirik. Coba lagi nanti.';
      }
    }
    const formatToRibuan = (number) => {
      return new Intl.NumberFormat('id-ID').format(number);
    }
    async function getIPDetails(text) {
      const apiUrl = `https://api.nyxs.pw/tools/ipchecker?ip=${encodeURIComponent(text)}`;

      try {
        // Melakukan request ke API menggunakan Axios
        const {
          data
        } = await axios.get(apiUrl);

        // Cek apakah statusnya true dan ambil result-nya
        if (data.status) {
          const result = data.result;

          // Pisahkan data IP satu per satu
          const ipDetails = {
            ip: result.ip,
            network: result.network,
            version: result.version,
            city: result.city,
            region: result.region,
            region_code: result.region_code,
            country: result.country,
            country_name: result.country_name,
            country_code: result.country_code,
            country_code_iso3: result.country_code_iso3,
            country_capital: result.country_capital,
            country_tld: result.country_tld,
            continent_code: result.continent_code,
            in_eu: result.in_eu,
            postal: result.postal,
            latitude: result.latitude,
            longitude: result.longitude,
            timezone: result.timezone,
            utc_offset: result.utc_offset,
            country_calling_code: result.country_calling_code,
            currency: result.currency,
            currency_name: result.currency_name,
            languages: result.languages,
            country_area: result.country_area,
            country_population: result.country_population,
            asn: result.asn,
            org: result.org,
          };

          // Mengembalikan hasil IP detail
          return ipDetails;
        } else {
          throw new Error('IP tidak ditemukan atau status false');
        }
      } catch (error) {
        console.error('Error fetching IP details:', error.message);
        return 'Tidak dapat mengambil detail IP. Coba lagi nanti.';
      }
    }
    tiky.susunkata = tiky.susunkata ? tiky.susunkata: {};

    if (from in tiky.susunkata) {
      const threshold2 = 0.72;
      let users2 = users[m.sender];
      let json = JSON.parse(JSON.stringify(tiky.susunkata[m.sender][1]));

      if (budy.toLowerCase() == json.jawaban.toLowerCase().trim()) {
        handlerPoint(senders, true); // Panggil handlerPoint jika jawaban benar
        tiky.sendMessage(m.chat, {
          react: {
            text: '✅', key: m.key
          }
        });
        let teks = `> Selamat anda mendapatkan: +${tiky.susunkata[m.sender][2]} Point`;
        reply(`${teks}`);
        clearTimeout(tiky.susunkata[m.sender][3]);
        delete tiky.susunkata[m.sender];
      } else if (similarity(budy.toLowerCase(), json.jawaban.toLowerCase().trim()) >= threshold2) {
        tiky.sendMessage(m.chat, {
          react: {
            text: '❎', key: m.key
          }
        });
      }
    }
    async function totalfiturr() {

      const fitur1 = () => {
        var mytext = fs.readFileSync("./case.js").toString()
        var numUpper = (mytext.match(/case '/g) || []).length
        return numUpper
      }
      const fitur2 = () => {
        var mytext = fs.readFileSync("./case.js").toString()
        var numUpper = (mytext.match(/case "/g) || []).length
        return numUpper
      }


      valvul = `${fitur1()} + ${fitur2()}`
      .replace(/[^0-9\-\/+*×÷πEe()piPI/]/g,
        '')
      .replace(/×/g,
        '*')
      .replace(/÷/g,
        '/')
      .replace(/π|pi/gi,
        'Math.PI')
      .replace(/e/gi,
        'Math.E')
      .replace(/\/+/g,
        '/')
      .replace(/\++/g,
        '+')
      .replace(/-+/g,
        '-')
      let format = valvul
      .replace(/Math\.PI/g,
        'π')
      .replace(/Math\.E/g,
        'e')
      .replace(/\//g,
        '÷')
      .replace(/\*×/g,
        '×')
      try {

        let resulto = (new Function('return ' + valvul))()
        if (!resulto) throw resulto
        return resulto
      } catch (e) {
        if (e == undefined) return reply('Isinya?')
        reply('Format salah, hanya 0-9 dan Simbol -, +, *, /, ×, ÷, π, e, (, ) yang disupport')
      }
    }
    const totalfitur = await totalfiturr()
    if (typeof global.owner === 'string' && String(body).match(`@${global.owner.split("@")[0]}`)) {
      reply('*`[ SYSTEM ]`* Ngapain Tag Ownerku ?');
    }
    let list = []
    for (let i of newowner) {
      list.push({
        displayName: await tiky.getName(i + '@s.whatsapp.net'),
        vcard: `BEGIN:VCARD\n
        VERSION:3.0\n
        N:${await tiky.getName(i + '@s.whatsapp.net')}\n
        FN:${await tiky.getName(i + '@s.whatsapp.net')}\n
        item1.TEL;waid=${i}:${i}\n
        item1.X-ABLabel:Ponsel\n
        item2.EMAIL;type=INTERNET:padild940@gmail.com\n
        item2.X-ABLabel:Email\n
        item3.URL:https://padz-store.vercel.app\n
        item3.X-ABLabel:WebSite\n
        item4.ADR:;;Indonesia;;;;\n
        item4.X-ABLabel:Region\n
        END:VCARD`
      })
    }
    if (!tiky.public) {
      if (!m.key.fromMe) return
    }
    if (m.message) {
      tiky.sendPresenceUpdate('available', m.chat)
      console.log('\x1b[1;31m~\x1b[1;37m>', '[\x1b[1;32m Tiky Botz \x1b[1;37m]', time, chalk.green(budy || m.mtype), 'Dari', chalk.blue(pushname), 'Di', chalk.yellow(groupName ? groupName: 'Private Chat'), 'args :', chalk.white(args.length))
    }
    //     if (!checkEasterEgg(budy, sender)) {
    //         return;
    //     }
    if (AntiLink)
      if (budy.includes("https://")) {
      if (!isBotAdmins) return
      if (isAdmins) return
      if (m.key.fromMe) return
      if (isCreator) return
      if (isPrem) return
      await tiky.sendMessage(m.chat,
        {
          delete: {
            remoteJid: m.chat,
            fromMe: false,
            id: m.key.id,
            participant: m.key.participant
          }
        })
      tiky.groupParticipantsUpdate(m.chat, [m.sender], 'delete')
      tiky.sendMessage(m.chat, {
        text: `\`\`\`「 Link Detected 」\`\`\`\n\n@${m.sender.split("@")[0]} You Message Has been delete, sorry.`, contextInfo: {
          mentionedJid: [m.sender]}}, {
        quoted: contactOwner
      })
    }
    if (AntiBadWord) {
      if (checkBadword(budy)) {
        if (!isBotAdmins) return;
        if (isAdmins) return;
        if (m.key.fromMe) return;
        if (isCreator) return;
        if (isPrem) return;

        // Menambah jumlah pelanggaran
        let senderId = m.sender;
        if (!badwordCount[senderId]) {
          badwordCount[senderId] = 1; // Awal mula pelanggaran
        } else {
          badwordCount[senderId]++;
        }

        // Simpan jumlah pelanggaran ke file JSON
        fs.writeFileSync('./database/badwordCount.json', JSON.stringify(badwordCount));

        // Jika pelanggaran melebihi batas, keluarkan pengguna
        if (badwordCount[senderId] >= maxBadWords) {
          tiky.groupParticipantsUpdate(m.chat, [senderId], 'remove');
          reply(`@${senderId.split("@")[0]} telah dikeluarkan karena melampaui batas kata kasar sebanyak ${maxBadWords} kali.`);
          // Reset penghitung setelah pengguna dikeluarkan
          delete badwordCount[senderId];
          fs.writeFileSync('./database/badwordCount.json', JSON.stringify(badwordCount));
        } else {
          reply(`\`\`\`「 Kata Kasar Terdeteksi 」\`\`\`\n\n@${senderId.split("@")[0]} telah mengirim kata-kata kasar. Peringatan ${badwordCount[senderId]}/${maxBadWords}.`);
        }

        // Hapus pesan yang mengandung kata kasar
        await tiky.sendMessage(m.chat, {
          delete: {
            remoteJid: m.chat,
            fromMe: false,
            id: m.key.id,
            participant: m.key.participant
          }
        });
      }
    }
    const Styles = (text, style = 1) => {

      var xStr = 'abcdefghijklmnopqrstuvwxyz1234567890'.split('');

      var yStr = {
        1: 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘqʀꜱᴛᴜᴠᴡxʏᴢ1234567890'
      };
      var replacer = [];
      xStr.map((v, i) =>
        replacer.push({
          original: v,
          convert: yStr[style].split('')[i]
        })
      );
      var str = text.toLowerCase().split('');
      var output = [];
      str.map((v) => {
        const find = replacer.find((x) => x.original == v);
        find ? output.push(find.convert): output.push(v);
      });
      return output.join('');
    };
    const habis = async() => {
      let kmuk = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
          message: {
            "messageContextInfo": {
              "deviceListMetadata": {},
              "deviceListMetadataVersion": 2
            },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              contextInfo: {
                mentionedJid: [m?.sender],
                isForwarded: false,
                externalAdReply: {
                  title: global.title,
                  body: global.body,
                  thumbnail: fs.readFileSync('./thumbnail/thumbnail.jpg'),
                  sourceUrl: global.sourceurl
                }
              },
              body: proto.Message.InteractiveMessage.Body.create({
                text: 'Limit anda telah habis.\n\nSilahkan klik tombol di bawah untuk membeli limit'
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: `© ${footer}`
              }),
              header: proto.Message.InteractiveMessage.Header.create({
                title: `${global.botname}`,
                subtitle: "Padz Store",
                hasMediaAttachment: true,
                ...(await prepareWAMessageMedia( {
                  document: fs.readFileSync('./package.json'),
                  mimetype: "application/msword",
                  fileLength: 99999999999999,
                  fileName: global.filename,
                }, {
                  upload: tiky.waUploadToServer
                }))
              }),
              gifPlayback: true,
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [{
                  "name": "quick_reply",
                  "buttonParamsJson": "{\"display_text\":\"Buy Limit\",\"id\":\"addlimit\"}"
                }]
              })
            })
          }
        }
      }, {
        quoted: contactOwner
      });
      await tiky.relayMessage(kmuk.key.remoteJid, kmuk.message, {
        messageId: kmuk.key.id
      });
    }
    const habis2 = async() => {
      let ksop = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
          message: {
            "messageContextInfo": {
              "deviceListMetadata": {},
              "deviceListMetadataVersion": 2
            },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              contextInfo: {
                mentionedJid: [m?.sender],
                isForwarded: false,
                externalAdReply: {
                  title: global.title,
                  body: global.body,
                  thumbnail: fs.readFileSync('./thumbnail/thumbnail.jpg'),
                  sourceUrl: global.sourceurl
                }
              },
              body: proto.Message.InteractiveMessage.Body.create({
                text: 'Point anda telah habis.\n\nSilahkan klik tombol di bawah untuk membeli point'
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: `© ${footer}`
              }),
              header: proto.Message.InteractiveMessage.Header.create({
                title: `${global.botname}`,
                subtitle: "Padz Store",
                hasMediaAttachment: true,
                ...(await prepareWAMessageMedia( {
                  document: fs.readFileSync('./package.json'),
                  mimetype: "application/msword",
                  fileLength: 99999999999999,
                  fileName: global.filename,
                }, {
                  upload: tiky.waUploadToServer
                }))
              }),
              gifPlayback: true,
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [{
                  "name": "quick_reply",
                  "buttonParamsJson": "{\"display_text\":\"Buy Point\",\"id\":\"addpoin\"}"
                }]
              })
            })
          }
        }
      }, {
        quoted: contactOwner
      });
      await tiky.relayMessage(ksop.key.remoteJid, ksop.message, {
        messageId: ksop.key.id
      });
    }
    let mons = '`';
    let mirg = '```';

    const commandTree = {
      '𝙄𝙣𝙛𝙤𝙧𝙢𝙖𝙩𝙞𝙤𝙣 𝙐𝙨𝙚𝙧𝙨': {
        'ᴜꜱᴇʀɴᴀᴍᴇ': `@${m?.sender.split("@")[0]}`,
        'ʟɪᴍɪᴛ': users[sender]?.limit !== undefined ? `${formatToRibuan(users[sender].limit)}`: 0,
        'ꜱᴀʟᴅᴏ': users[sender]?.saldo !== undefined ? formatToIDR(users[sender].saldo): 0,
        'ᴘᴏɪɴᴛ': users[sender]?.point !== undefined ? formatToRibuan(users[sender].point): 0,
        'ᴠᴇʀɪꜰʏᴇᴅ': `${mirg}${users[sender]?.verified === true ? 'true': 'false'}${mirg}`,
        'ꜱᴛᴀᴛᴜꜱ': isCreator ? `Creator${readmore}`: (isPrem ? `Premium${readmore}`: `New Bie${readmore}`),
      },
      ...(isGroup && isBotAdmins && isGroupOwner ? {
        '𝙂𝙧𝙤𝙪𝙥 𝙈𝙖𝙣𝙖𝙜𝙚𝙢𝙚𝙣𝙩': {
          'ᴋɪᴄᴋ': `${mons}On${mons}`,
          'ᴀᴅᴅ': `${mons}On${mons}`,
          'ᴅᴇᴍᴏᴛᴇ': `${mons}On${mons}`,
          'ᴘʀᴏᴍᴏᴛᴇ': `${mons}On${mons}`, // Hanya di grup dan bot admin
          'ᴄʟᴏꜱᴇ': `${mons}On${mons}`, // Hanya di grup dan bot admin
          'ᴏᴘᴇɴ': `${mons}On${mons}`, // Hanya di grup dan bot admin
          'ʟᴀᴠᴇɢᴄ': `${mons}On${mons}`, // Hanya untuk owner grup
          'ʀᴇꜱᴇᴛʟɪɴᴋɢᴄ': `${mons}On${mons}`,
        }
      }: {}),
      ...(isCreator || isPrem ? {
        '𝘽𝙤𝙩 𝙎𝙚𝙩𝙩𝙞𝙣𝙜𝙨': {
          'ꜱᴇʟꜰ': `${mons}On${mons}`,
          'ᴘᴜʙʟɪᴄ': `${mons}On${mons}`,
          'ꜱᴇᴛᴛɪɴɢ': `${mons}On${mons}`,
          'ᴅᴇʟꜱᴇꜱꜱɪᴏɴ': `${mons}On${mons}`,
          'ꜱᴇᴛʙɪᴏʙᴏᴛ': `${mons}On${mons}`,
          'ᴅᴇʟᴘᴘʙᴏᴛ': `${mons}On${mons}`,
          'ꜱᴇᴛᴘᴘʙᴏᴛ': `${mons}On${mons}`,
          'ʟɪsᴛᴘʀᴇᴍ': `${mons}On${mons}`, // Hanya creator
          'ᴅᴇʟᴘʀᴇᴍ': `${mons}On${mons}`, // Hanya creator
          'ᴀᴅᴅᴘʀᴇᴍ': `${mons}On${mons}`, // Hanya creator
          'ᴀᴅᴅʟɪᴍɪᴛ': `${mons}On${mons}`, // Hanya creator
          'ᴀᴅᴅᴘᴏɪɴ': `${mons}On${mons}`, // Hanya creator
          'ᴀᴅᴅꜱᴀʟᴅᴏ': `${mons}On${mons}`,
          'ᴅᴇʟᴄᴀꜱᴇ': `${mons}On${mons}`,
          'ɢᴇᴛᴄᴀꜱᴇ': `${mons}On${mons}`,
          'ᴀᴜᴛᴏʀᴇᴀᴅ': `${mons}On${mons}`,
          'ᴅᴏɴᴇ': `${mons}On${mons}`,
          'ᴘʀᴏꜱᴇꜱ': `${mons}On${mons}`,
          'ʙᴀᴛᴀʟ': `${mons}On${mons}`,
          'ɢᴇᴛꜱᴇꜱꜱɪᴏɴ': `${mons}On${mons}`,
        }
      }: {}),
      ...(isPrem || isGroup ? {
        '𝘼𝙣𝙩𝙞-𝙎𝙥𝙖𝙢': {
          'ᴀɴᴛɪʟɪɴᴋ': `${mons}On${mons}`,
          'ᴀɴᴛɪʙᴀᴅᴡᴏʀᴅ': `${mons}On${mons}`,
        },
      }: {}),
      '𝙈𝙚𝙙𝙞𝙖 & 𝙁𝙚𝙖𝙩𝙪𝙧𝙚𝙨': {
        'ʜᴅ': `${mons}On${mons}`,
        'ʀᴇᴀᴅᴠɪᴇᴡᴏɴᴄᴇ': `${mons}On${mons}`,
        'ᴅᴜᴄᴋᴅᴜᴄᴋɢᴏ': `${mons}On${mons}`,
        'ᴛʀᴀɴꜱʟᴀᴛᴇ': `${mons}On${mons}`,
      },
      '𝙈𝙞𝙨𝙘𝙚𝙡𝙡𝙖𝙣𝙚𝙤𝙪𝙨': {
        'ᴛᴏᴛᴀʟꜰɪᴛᴜʀ': `${mons}On${mons}`,
        'ɢᴘᴛ4': `${mons}On${mons}`,
        'ʟɪꜱᴛᴄᴀꜱᴇ': `${mons}On${mons}`,
        'ᴄʜᴀᴛɢᴘᴛ': `${mons}On${mons}`,
        'ʟɪʀɪᴋ': `${mons}On${mons}`,
        'ᴄʜᴇᴄᴋɪᴘ': `${mons}On${mons}`,
        'ʙᴜʏᴘᴀɴᴇʟ': `${mons}On${mons}`,
        // Perintah untuk semua user
        'ᴘɪɴɢ': `${mons}On${mons}`,
        // Perintah untuk semua user
        'ᴏᴡɴᴇʀ': `${mons}On${mons}`,
      }
    };
    function getXpBar(currentXp, xpForNextLevel, length = 10) {
      const progress = Math.floor((currentXp / xpForNextLevel) * length);
      const bar = '█'.repeat(progress) + '░'.repeat(length - progress); // '█' untuk progress, '░' untuk sisa
      return bar;
    }

    // Menampilkan XP, persentase, dan progress bar
    const expDisplay = users[sender]
    ? (users[sender].xp !== undefined && users[sender].level !== undefined
      ? `${users[sender].xp}/${getXpForLevel(users[sender].level)} (${Math.floor((users[sender].xp / getXpForLevel(users[sender].level)) * 100)}%) [${getXpBar(users[sender].xp, getXpForLevel(users[sender].level))}]`: 'Data XP atau level tidak tersedia'): 'Pengguna tidak ditemukan';
    switch (command) {
      case 'cekidgc':
        if (!isCreator) return reply('Hanya untuk owner')
        if (!isGroup) {
          return reply('Perintah ini hanya dapat digunakan di dalam grup.');
        }
        reply(`ID Grup ini adalah: ${m.chat}`);
        break;
      case 'me':
        let userStatus = {
          '> [ `keuangan` ]': {
            'Limit': users[sender]?.limit !== undefined ? `${formatToRibuan(users[sender].limit)}`: 0,
            'Point': users[sender]?.point !== undefined ? formatToRibuan(users[sender].point): 0,
            'Saldo': users[sender]?.saldo !== undefined ? formatToIDR(users[sender].saldo): 0
          },
          '> [ `statistik` ]': {
            'Date Register': users[sender]?.dateAdded ? users[sender].dateAdded: 'Data tidak tersedia',
            'Verify': users[sender]?.verified === true ? 'true': 'false',
            'Role': isCreator ? 'Creator': (isPrem ? 'Premium': 'New Bie'),
            'Exp': users[sender] && users[sender].xp !== undefined && users[sender].level !== undefined
            ? `${users[sender].xp}/${getXpForLevel(users[sender].level)} (${Math.floor((users[sender].xp / getXpForLevel(users[sender].level)) * 500)}%) [${getXpBar(users[sender].xp, getXpForLevel(users[sender].level))}]`: 'Data XP atau level tidak tersedia',
            'Level': users[sender]?.level !== undefined
            ? (users[sender].level === 500 ? `${users[sender].level} (Max Level)`: users[sender].level): 'Data tidak tersedia',
            'Rank': users[sender]?.level !== undefined ? getRank(users[sender].level): 'Data tidak tersedia'
          }
        };
        let profilesp = await tiky.profilePictureUrl(m?.sender, 'image').catch(_ => 'https://telegra.ph/file/6880771a42bad09dd6087.jpg');
        tiky.sendMessage(m.chat, {
          document: fs.readFileSync('./database/Docu/PadilDev.docx'),
          thumbnailUrl: profilesp,
          mimetype: 'application/pdf',
          fileLength: 99999,
          pageCount: '80000',
          fileName: global.filename,
          caption: `${treeify.asTree(userStatus, true)}`,
          contextInfo: {
            mentionedJid: [m?.sender],
            externalAdReply: {
              showAdAttribution: true,
              title: `${Styles('username')}: ${m?.pushName}`,
              body: global.botname,
              thumbnailUrl: profilesp,
              sourceUrl: `https://wa.me/${senders.split('@')[0]}`,
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        }, {
          quoted: contactOwner
        })
        break
      case 'buatkode':
      case 'sendkode':
      case 'sref':
      case 'cref':
        if (!isCreator || !isPrem) return reply('Hanya untuk owner atau pengguna premium')
        let pakiry = '`';
        const points2 = parseInt(args[0]); // Ambil jumlah poin dari argumen pertama
        let target = args[1]; // Ambil ID pengguna atau grup dari argumen kedua

        if (!points2 || points2 <= 0) return reply('Masukkan jumlah poin yang valid');
        if (points2 >= 99999999999999) return reply('Value tersebut hanya bisa digunakan oleh owner');

        const code2 = Math.random().toString(36).substr(2, 6).toUpperCase(); // Buat kode referral acak

        // Simpan data referral baru ke referralData
        referralData[code2] = {
          userId: senders,
          points: points2,
          active: true
        };

        users[senders].point -= points2;

        // Simpan ke file JSON
        fs.writeFileSync('./database/referrals.json', JSON.stringify(referralData, null, 2));
        fs.writeFileSync('./database/user.json', JSON.stringify(users, null, 2));

        // Tambahkan akhiran yang tepat jika tidak ada
        if (target) {
          if (!target.endsWith('@s.whatsapp.net') && !target.endsWith('@g.us')) {
            if (target.startsWith('62')) {
              // Misalkan jika target adalah nomor telepon
              target = `${target}@s.whatsapp.net`; // Menambahkan format ID pengguna
            } else {
              target = `${target}@g.us`; // Menambahkan format ID grup
            }
          }

          // Kirim kode referral ke grup atau pengguna

          await tiky.sendMessage(m.chat, {
            document: fs.readFileSync("./package.json"),
            fileName: global.filename,
            fileLength: 99999999999999,
            mimetype: 'application/pdf',
            caption: `Halo! Kode referral ${pakiry}${code2}${pakiry} telah dibuat oleh @${senders.split('@')[0]} . Gunakan sekarang untuk klaim reward Anda!`,
            isForwarded: false,
            contextInfo: {
              mentionedJid: [senders],
              externalAdReply: {
                title: global.botname,
                body: global.author,
                showAdAttribution: true,
                mediaType: 2,
                thumbnail: fs.readFileSync('./thumbnail/thumbnail.jpg'),
                sourceUrl: global.sourceurl
              }
            }
          }, {
            quoted: contactOwner, ephemeralExpiration: 86400
          });

          reply(`Kode referral ${pakiry}${code2}${pakiry} telah dikirim ke @${target.split('@')[0]}. Anda kehilangan ${formatToRibuan(points2)} point, sisa point anda ${formatToRibuan(users[senders].point)}`);
        } else {
          // Jika target tidak valid
          reply('Target tidak valid. Silakan masukkan ID pengguna atau grup yang valid.');
        }
        break;
      case 'buylimit':
      case 'addlimit':
        if (!args[0]) return reply(`Silahkan kirim ulang seperti ini: ${command} 5`);

        // Gunakan nomor pengirim (m.sender) secara otomatis
        let nomor = m.sender;
        let amount = parseInt(args[0]); // Limit amount to be bought
        let totalCost = 1000 * amount; // Each limit costs 1000 saldo

        // Check if the amount is valid and within the range
        if (amount < 5 || amount > 100000) return reply(`Jumlah limit harus antara 5 hingga 100.000 limit.`);

        // Check if the user exists in the database
        if (users[nomor]) {
          // Check if user has enough saldo
          if (users[nomor].saldo >= totalCost) {
            // Deduct saldo and add limit
            users[nomor].saldo -= totalCost;
            users[nomor].limit += amount;

            // Save the updated data to the database
            fs.writeFileSync('./database/user.json', JSON.stringify(users, null, 2));

            // Reply with success message
            reply(`Limit ${amount} telah dibeli.\nLimit sekarang: ${users[nomor].limit}.
              \nBiaya total: ${formatToIDR(totalCost)}.\nSaldo tersisa: ${formatToIDR(users[nomor].saldo)}`);
          } else {
            // Reply with error message if saldo is not enough
            reply(`Saldo @${m?.sender.split("@")[0]} tidak cukup untuk membeli ${amount} limit.\nBiaya total: ${formatToIDR(totalCost)}\nSaldo saat ini: ${formatToIDR(users[nomor].saldo)}`);
          }
        } else {
          reply(`Pengguna @${m?.sender.split("@")[0]} tidak ditemukan dalam database. Silakan tambahkan pengguna terlebih dahulu.`);
        }
        break;
      case 'deposit':
      case 'addsaldo':
        if (!isCreator || !isPrem) return reply(`Hanya Untuk Owner`);
        if (!args[0] || !args[1]) return reply(`Penggunaan yang benar: ${command} 628xxx 5000`);

        // Extract the number and limit amount
        let no = args[0].replace(/[^0-9]/g, '') + `@s.whatsapp.net`;
        let jmlh = parseInt(args[1]); // Limit amount to be added

        // Check if the number is valid in WhatsApp
        let nonya = await tiky.onWhatsApp(no);
        if (nonya.length === 0) return reply(`Lu masukin nomor siapa tolol!!!`);

        if (amo < 1000 || amo > 50000000) return reply(`Minimal deposit: ${formatToIDR(1000)}\nMaksimal deposit: ${formatToIDR(50000000)}\n\nNOTE: Jika saldo tidak masuk, segera hubungi owner`);

        // Check if the user exists in the database
        if (users[no]) {
          // Add limit to the user
          users[no].saldo += jmlh;
          fs.writeFileSync('./database/user.json', JSON.stringify(users, null, 2));
          reply(`Saldo ${formatToIDR(jmlh)} telah ditambahkan untuk ${no}.\nSaldo sekarang: ${formatToIDR(users[sender].saldo)}`);
        } else {
          reply(`Pengguna @${m?.sender.split("@")[0]} tidak ditemukan dalam database. Silakan tambahkan pengguna terlebih dahulu.`);
        }
        break;
      case 'addpoin':
      case 'buypoin':
        if (!args[0]) return reply(`Silahkan kirim ulang seperti ini: ${command} 50`);

        // Extract the number and point amount
        let num = m.sender
        let amo = parseInt(args[0]); // Point amount to be added
        let totalC = 0; // Variable to hold the total cost

        // Check if the number is valid in WhatsApp
        let ceck = await tiky.onWhatsApp(num);
        if (ceck.length === 0) return reply(`Lu masukin nomor siapa tolol!!!`);

        // Check if the amount is valid and within the range
        if (amo < 50 || amo > 100000) return reply(`Minimal: 50 Point\nMaksimal: 100.000 Point`);

        // Calculate total cost based on the number of points
        totalC = amo * 500; // Each point costs 500 perak

        // Check if the user exists in the database
        if (users[num]) {
          // Check if user has enough saldo
          if (users[num].saldo >= totalC) {
            // Deduct saldo and add points
            users[num].saldo -= totalC;
            users[num].point += amo;

            // Save the updated data to the database
            fs.writeFileSync('./database/user.json', JSON.stringify(users, null, 2));

            // Reply with success message
            reply(`Point ${amo} telah ditambahkan untuk @${m?.sender.split("@")[0]}.\nPoin sekarang: ${users[num].point}.\nBiaya total: ${formatToIDR(totalC)}.\nSaldo tersisa: ${formatToIDR(users[sender].saldo)}`);
          } else {
            reply(`Saldo @${m?.sender.split("@")[0]} tidak cukup untuk menambah poin.\nBiaya total: ${formatToIDR(totalC)}\nSaldo saat ini: ${formatToIDR(users[sender].saldo)}`);
          }
        } else {
          reply(`Pengguna @${m?.sender.split("@")[0]} tidak ditemukan dalam database. Silakan tambahkan pengguna terlebih dahulu.`);
        }
        break;
      case 'duck':
        if (!isVerified(senders)) {
          return reply(`Nomor anda belum terverifikasi di bot kami, silahkan ketik \`verify\` untuk memverifikasi nomor anda.`);
        }
        if (!text) return reply("Masukan query yang ingin anda cari")

        const results = await searchDuckDuckGo(text);
        let replyMessage = 'Hasil pencarian DuckDuckGo:\n\n';
        if (results.length > 0) {
          results.forEach((result, index) => {
            replyMessage += `${index + 1}. *${result.name}*\n${result.url}\n\n`;
          });
        } else {
          replyMessage = 'Tidak ada hasil yang ditemukan.';
        }
        await reply(replyMessage);
        break;
      case 'tr': {
        if (!isVerified(senders))
          return reply(`Nomor anda belum terverifikasi di bot kami, silahkan ketik \`verify\` untuk memverifikasi nomor anda.`);

        if (users[sender].point <= 0) {
          habis2()
        } else {
          if (!text.includes(">")) {
            return reply("Format salah. Gunakan format Teks,bahasa\n\n*Contoh :* I love you>id");
          }

          let [inputText,
            lang] = text.split(",");
          if (!checkLanguageAvailability(lang)) return;
          handlerPoint(senders, false);
          translateText(inputText.trim(), lang.trim());
        }
      }
        break;
      case 'cekip':
        if (!isVerified(senders)) return reply(`Nomor anda belum terverifikasi di bot kami, silahkan ketik \`verify\` untuk memverifikasi nomor anda.`)
        if (users[sender].point <= 0) {
          habis2()
        } else {
          if (!text) return reply('Masukan IP yang ingin anda cek')
          handlerPoint(senders, false);
          getIPDetails(text).then(ipDetails => {
            let padilz = '```'
            const fullString = `
            IP: ${ipDetails.ip}
            Network: ${ipDetails.network}
            Version: ${ipDetails.version}
            City: ${ipDetails.city}
            Region: ${ipDetails.region}
            Region Code: ${ipDetails.region_code}
            Country: ${ipDetails.country}
            Country Name: ${ipDetails.country_name}
            Country Code: ${ipDetails.country_code}
            Country Code ISO3: ${ipDetails.country_code_iso3}
            Country Capital: ${ipDetails.country_capital}
            Country TLD: ${ipDetails.country_tld}
            Continent Code: ${ipDetails.continent_code}
            In EU: ${ipDetails.in_eu}
            Postal: ${ipDetails.postal}
            Latitude: ${ipDetails.latitude}
            Longitude: ${ipDetails.longitude}
            Timezone: ${ipDetails.timezone}
            UTC Offset: ${ipDetails.utc_offset}
            Country Calling Code: ${ipDetails.country_calling_code}
            Currency: ${ipDetails.currency}
            Currency Name: ${ipDetails.currency_name}
            Languages: ${ipDetails.languages}
            Country Area: ${ipDetails.country_area}
            Country Population: ${ipDetails.country_population}
            ASN: ${ipDetails.asn}
            Org: ${ipDetails.org}`;
            m.reply(`Ini bre dah dapet\n${padilz}${fullString}${padilz}`);
          });
        }
        break
      case 'lirik':
        if (!isVerified(senders)) return reply(`Nomor anda belum terverifikasi di bot kami, silahkan ketik \`verify\` untuk memverifikasi nomor anda.`)
        if (users[sender].point <= 0) {
          habis2()
        } else {
          if (!text) return reply('Masukan nama lagu')
          handlerPoint(senders, false);
          getLyrics(text).then(lyrics => {
            let kash = '```'
            m.reply(`Judul: ${text}\nNih liriknya:\n\n${kash}${lyrics}${kash}`);
          });
        }
        break
      case 'delete':
        if (!isVerified(senders)) return reply(`Nomor anda belum terverifikasi di bot kami, silahkan ketik \`verify\` untuk memverifikasi nomor anda.`)
        if (!m.quoted) return reply('Reply pesan yang ingin dihapus!')
        tiky.sendMessage(m.chat, {
          delete: {
            remoteJid: m.chat, id: m.quoted.id, fromMe: m.quoted.fromMe, participant: m.quoted.senders
          }})
        break
      case 'delppgc': {
        if (!isVerified(senders)) return reply(`Nomor anda belum terverifikasi di bot kami, silahkan ketik \`verify\` untuk memverifikasi nomor anda.`)
        if (!m.isGroup) return
        if (!isAdmins) return
        if (!isBotAdmins) return
        await tiky.removeProfilePicture(from)
      }
        break
      case 'getsession':
        if (!isCreator) return reply("Kamu bukan ownerku")

        let sesi = fs.readFileSync('./sessions/creds.json')
        tiky.sendMessage(m.chat, {
          document: sesi,
          mimetype: 'application/json',
          fileName: 'creds.json'
        }, {
          quoted: contactOwner
        })
        break
      case 'listcase': {
        if (!isVerified(senders)) return reply(`Nomor anda belum terverifikasi di bot kami, silahkan ketik \`verify\` untuk memverifikasi nomor anda.`)
        const listCase = () => {
          const code = fs.readFileSync("./case.js", "utf8")
          var regex = /case\s+'([^']+)':/g;
          var matches = [];
          var match;
          while ((match = regex.exec(code))) {
            matches.push(match[1]);
          }
          let teks = `*Total Case*: ${matches.length} \n\n`
          matches.forEach(function (x) {
            teks += x + "\n"
          })
          return teks
        }
        reply(listCase())
      }
        break
      case 'ping': {
        const used = process.memoryUsage();
        const cpus = os.cpus().map((cpu) => {
          cpu.total = Object.keys(cpu.times).reduce(
            (last, type) => last + cpu.times[type],
            0,
          );
          return cpu;
        });
        const cpu = cpus.reduce(
          (last, cpu, _, {
            length
          }) => {
            last.total += cpu.total;
            last.speed += cpu.speed / length;
            last.times.user += cpu.times.user;
            last.times.nice += cpu.times.nice;
            last.times.sys += cpu.times.sys;
            last.times.idle += cpu.times.idle;
            last.times.irq += cpu.times.irq;
            return last;
          },
          {
            speed: 0,
            total: 0,
            times: {
              user: 0,
              nice: 0,
              sys: 0,
              idle: 0,
              irq: 0,
            },
          },
        );

        var date = new Date();
        var jam = date.getHours();
        var menit = date.getMinutes();
        var detik = date.getSeconds();
        var ram = `${formatSize(process.memoryUsage().heapUsed)} / ${formatSize(os.totalmem)}`;
        var cpuuuu = os.cpus();
        var sisaram = `${Math.round(os.freemem)}`;
        var totalram = `${Math.round(os.totalmem)}`;
        var persenram = (sisaram / totalram) * 100;
        var persenramm = 100 - persenram;
        var ramused = totalram - sisaram;

        var space = await checkDiskSpace(process.cwd());
        var freespace = `${Math.round(space.free)}`;
        var totalspace = `${Math.round(space.size)}`;
        var diskused = totalspace - freespace;
        var neww = performance.now();
        var oldd = performance.now();
        let timestamp = speed();
        let latensi = speed() - timestamp;
        var {
          download,
          upload
        } = await checkBandwidth();
        let respon = `_*KECEPATAN*_
        ${Math.round(neww - oldd)} ms
        ${latensi.toFixed(4)} ms

        _*BERJALAN SELAMA*_
        ${runtime(process.uptime())}

        _*SPEK SERVER*_
        _RAM_: ${formatSize(ramused)} (${persenramm?.toString().split('.')[0]}%) / ${formatSize(totalram)}
        _FREE RAM_: ${formatSize(sisaram)}
        _MEMORY_: ${ram}
        _DISK_: ${formatSize(diskused)} / ${formatSize(totalspace)}
        _BEBAS_: ${formatSize(freespace)}
        _PLATFORM_: ${os.platform()}
        _UPLOAD_: ${upload}
        _DOWNLOAD_ ${download}
        _CPU Model_: ${cpuuuu[0].model}`
        tiky.relayMessage(m?.chat, {
          requestPaymentMessage: {
            currencyCodeIso4217: 'IDR',
            amount1000: 1000000000,
            requestFrom: '0@s.whatsapp.net',
            noteMessage: {
              extendedTextMessage: {
                text: respon,
                contextInfo: {
                  mentionedJid: [m?.sender],
                  externalAdReply: {
                    showAdAttribution: true
                  }}}}}}, {})
      }
        console.log(cpuuuu)
        break
      case 'totalfitur':
        reply(`Total fitur yang tersedia: ${totalfitur}`)
        break
      case 'close':
        if (!isVerified(senders)) return reply(`Nomor anda belum terverifikasi di bot kami, silahkan ketik \`verify\` untuk memverifikasi nomor anda.`)
        if (!m.isGroup) return reply("Fitur hanya bisa di gunakan di group")
        if (!isBotAdmins) return reply("Bot harus menjadi admin untuk menggunakan fitur ini")
        if (args[1] == "detik") {
          var timer = args[0]*`1000`
        } else if (args[1] == "menit") {
          var timer = args[0]*`60000`
        } else if (args[1] == "jam") {
          var timer = args[0]*`3600000`
        } else if (args[1] == "hari") {
          var timer = args[0]*`86400000`
        } else {
          return reply("*Pilih:*\ndetik\nmenit\njam\n\n*Contoh*\n1 jam")}
        reply(`Close time ${q} dimulai`)
        setTimeout(() => {
          const close = 'Group telah di tutup oleh admin'
          tiky.groupSettingUpdate(m.chat, 'announcement')
          reply(close)
        }, timer)
        break
      case 'open':
        if (!isVerified(senders)) return reply(`Nomor anda belum terverifikasi di bot kami, silahkan ketik \`verify\` untuk memverifikasi nomor anda.`)
        if (!m.isGroup) return reply("Fitur hanya bisa di gunakan di group")
        if (!isBotAdmins) return reply("Bot harus menjadi admin untuk menggunakan fitur ini")
        if (args[1] == "detik") {
          var timer = args[0]*`1000`
        } else if (args[1] == "menit") {
          var timer = args[0]*`60000`
        } else if (args[1] == "jam") {
          var timer = args[0]*`3600000`
        } else if (args[1] == "hari") {
          var timer = args[0]*`86400000`
        } else {
          return reply("*Pilih:*\ndetik\nmenit\njam\n\n*contoh*\n1 jam")}
        reply(`Open time ${q} dimulai`)
        setTimeout(() => {
          const open = 'Group telah di buka kembali oleh admin'
          tiky.groupSettingUpdate(m.chat, 'not_announcement')
          reply(open)
        }, timer)
        break
      case 'antibad': {
        if (!isVerified(senders)) return reply(`Nomor anda belum terverifikasi di bot kami, silahkan ketik \`verify\` untuk memverifikasi nomor anda.`);
        if (!isGroup) return reply('Perintah ini hanya bisa digunakan di grup.');
        if (!isBotAdmins) return reply('Bot harus jadi admin');
        if (!isPrem) return reply('Hanya untuk premium')

        if (args[0] === "on") {
          if (AntiBadWord) return reply('Fitur antibadword sudah diaktifkan.');
          antibadword.push(m.chat);
          fs.writeFileSync('./database/antibadword.json', JSON.stringify(antibadword));
          var groupMeta = await tiky.groupMetadata(m.chat);
          var members = groupMeta['participants'];
          var mems = [];
          members.map(async adm => {
            mems.push(adm.id.replace('c.us', 's.whatsapp.net'));
          });
          tiky.sendMessage(m.chat, {
            text: `\`\`\`「 ⚠️ Warning ⚠️ 」\`\`\`\n\nJangan mengirimkan kata-kata kasar di grup ini atau Anda akan dikeluarkan jika melampaui batas 5 kali.`,
            contextInfo: {
              mentionedJid: mems
            }
          }, {
            quoted: contactOwner
          });
        } else if (args[0] === "off") {
          if (!AntiBadWord) return reply('Fitur antibadword sudah dinonaktifkan.');
          let offIndex = antibadword.indexOf(m.chat);
          antibadword.splice(offIndex, 1);
          fs.writeFileSync('./database/antibadword.json', JSON.stringify(antibadword));
          reply('Fitur antibadword berhasil dinonaktifkan.');
        } else {
          reply(`Silakan gunakan format yang benar\n\nContoh: ${command} on\nContoh: ${command} off\n\non untuk mengaktifkan\noff untuk menonaktifkan`);
        }
      }
        break;
      case 'antilink': {
        if (!isVerified(senders)) return reply(`Nomor anda belum terverifikasi di bot kami, silahkan ketik \`verify\` untuk memverifikasi nomor anda.`)
        if (!isGroup) return reply(`Hanya di Group`)
        if (!isBotAdmins) return reply(`Bot harus jadi admin`)
        if (!isPrem) return reply('Hanya untuk premium')
        if (args[0] === "on") {
          if (AntiLink) return reply('Already activated')
          antilink.push(m.chat)
          fs.writeFileSync('./database/antilink.json', JSON.stringify(antilink))
          var groupe = await tiky.groupMetadata(m.chat)
          var members = groupe['participants']
          var mems = []
          members.map(async adm => {
            mems.push(adm.id.replace('c.us', 's.whatsapp.net'))
          })
          tiky.sendMessage(m.chat, {
            text: `\`\`\`「 ⚠️ Warning ⚠️ 」\`\`\`\n\nIf you're not an admin, don't send any link in this group or u will be kicked immediately!`, contextInfo: {
              mentionedJid: mems
            }}, {
            quoted: contactOwner
          })
        } else if (args[0] === "off") {
          if (!AntiLink) return reply('Already deactivated')
          let off = antilink.indexOf(m.chat)
          antilink.splice(off, 1)
          fs.writeFileSync('./database/antilink.json', JSON.stringify(antilink))
          reply('Success in turning off all antilink in this group')
        } else {
          await reply(`Please Type The Option\n\nExample: ${command} on\nExample: ${command} off\n\non to enable\noff to disable`)
        }
      }
        break
      case "autoread": {
        if (!isCreator || !isPrem) return reply("Kamu Bukan Owner");
        if (args.length < 1) return reply(`Contoh ${command} on/off`)
        if (q === 'on') {
          global.autoread = true
          reply(`Berhasil mengubah autoread ke ${q}`)
        } else if (q === 'off') {
          global.autoread = false
          reply(`Berhasil mengubah autoread ke ${q}`)
        }
      }
        break
      case 'leavegc': {
        if (!isCreator) return reply("Kamu Bukan Owner");
        if (!m.isGroup) return
        await tiky.groupLeave(m.chat).then((res) => reply(jsonformat(res))).catch((err) => reply(jsonformat(err)))
      }
        break
      case 'demote': {
        if (!isVerified(senders)) return reply(`Nomor anda belum terverifikasi di bot kami, silahkan ketik \`verify\` untuk memverifikasi nomor anda.`)
        if (m?.isGroup && !isAdmins && !isGroupOwner && isBotAdmins) return
        if (!text && !m?.quoted) reply('masukkan nomor yang ingin di demote')
        let users = m?.quoted ? m?.quoted.sender: text.replace(/[^0-9]/g, '')+'@s.whatsapp.net'
        await tiky.groupParticipantsUpdate(m?.chat, [users], 'demote').catch(console.log)
        reply(`@${users.split("@")[0]} Telah di turunkan menjadi member`)
      }
        break
      case 'promote': {
        if (!isVerified(senders)) return reply(`Nomor anda belum terverifikasi di bot kami, silahkan ketik \`verify\` untuk memverifikasi nomor anda.`)
        if (m?.isGroup && !isAdmins && !isGroupOwner && isBotAdmins) return
        if (!text && !m?.quoted) reply('masukkan nomor yang ingin di promote')
        let users = m?.quoted ? m?.quoted.sender: text.replace(/[^0-9]/g, '')+'@s.whatsapp.net'
        await tiky.groupParticipantsUpdate(m?.chat, [users], 'promote').catch(console.log)
        reply(`@${users.split("@")[0]} Telah di angkat menjadi moderator`)
      }
        break
      case 'kick': {
        if (!isVerified(senders)) return reply(`Nomor anda belum terverifikasi di bot kami, silahkan ketik \`verify\` untuk memverifikasi nomor anda.`)
        if (m?.isGroup && !isAdmins && !isGroupOwner && isBotAdmins) return
        if (!text && !m?.quoted) reply('masukkan nomor yang ingin di kick')
        let users = m?.quoted ? m?.quoted.sender: text.replace(/[^0-9]/g, '')+'@s.whatsapp.net'
        await tiky.groupParticipantsUpdate(m?.chat, [users], 'remove').catch(console.log)
      }
        break
      case 'add': {
        if (!isVerified(senders)) return reply(`Nomor anda belum terverifikasi di bot kami, silahkan ketik \`verify\` untuk memverifikasi nomor anda.`)
        if (m?.isGroup && !isAdmins && !isGroupOwner && isBotAdmins) return
        if (!text && !m?.quoted) reply('masukkan nomor yang ingin di tambahkan')
        let users = m?.quoted ? m?.quoted.sender: text.replace(/[^0-9]/g, '')+'@s.whatsapp.net'
        await tiky.groupParticipantsUpdate(m?.chat, [users], 'add').catch(console.log)
      }
        break
      case 'public':
        if (!isCreator || !isPrem) return reply("Kamu Bukan Owner");
        tiky.public = true
        reply("Bot di ubah menjadi public")
        break

      case 'self':
        if (!isCreator || !isPrem) return reply("Kamu Bukan Owner");
        tiky.public = false
        reply("Bot di ubah menjadi self")
        break
      case 'gpt4':
        if (!isVerified(senders)) return reply(`Nomor anda belum terverifikasi di bot kami, silahkan ketik \`verify\` untuk memverifikasi nomor anda.`)
        if (!text) return reply('Wrong query');
        if (users[sender].limit <= 0) {
          habis()
        } else {
          handlerLimit(senders, false);
          try {
            let cct = await fetchJson(`https://widipe.com/gpt4?text=${text}`);
            let resq = cct.result;
            reply(`${resq}`);
          } catch (err) {
            reply(`Error not response: ${err}`);
          }
        }
        break;
      case "welcome":
        if (!isCreator || !isPrem) return reply("Kamu Bukan Owner");
        if (!text) {
          reply(`Silahkan ketik ${command} on/off untuk mematikan atau menghidupkan`)
        } else {
          if (text === "on") {
            if (global.welcome === true) return reply("*_status: true_*")
            global.welcome = true
            reply ("*_Succes Change, status: true_*")
          } else if (text === "off") {
            if (global.welcome === false) return reply("*_status: false_*")
            global.welcome = false
            reply("*_Succes Change, status: false_*")
          }
        }
        break
      case 'rvo': {
        if (!isVerified(senders)) return reply(`Nomor anda belum terverifikasi di bot kami, silahkan ketik \`verify\` untuk memverifikasi nomor anda.`)
        if (!m.quoted) return reply(`Balas untuk melihat pesan sekali`)
        if (m.quoted.mtype !== 'viewOnceMessageV2') return reply(`This is not a view once message`)
        let msg = m.quoted.message
        let type = Object.keys(msg)[0]
        let media = await downloadContentFromMessage(msg[type], type == 'imageMessage' ? 'image': 'video')
        let buffer = Buffer.from([])
        for await (const chunk of media) {
          buffer = Buffer.concat([buffer, chunk])
        }
        if (/video/.test(type)) {
          return tiky.sendFile(m.chat, buffer, 'media.mp4', msg[type].caption || '', m)
        } else if (/image/.test(type)) {
          return tiky.sendFile(m.chat, buffer, 'media.jpg', msg[type].caption || '', m)
        }
      }
        break
      case 'setbiobot': {
        if (!isCreator || !isPrem) return reply("Kamu Bukan Owner");
        if (!q) return reply(`Kirim perintah ${command} nama\n\nContoh : ${command} Padil Gans`)
        await tiky.updateProfileStatus(q)
        await reply(`Berhasil mengganti status bio ke *${q}*`)
      }
        break
      case 'delppbot': {
        if (!isCreator || !isPrem) return reply("Kamu Bukan Owner");
        tiky.removeProfilePicture(tiky.user.id)
        reply("success")
      }
        break
      case 'done':
        {
          if (!isCreator) return reply("Perintah hanya untuk owner"); // Memastikan hanya pemilik yang bisa menggunakan
          if (!text) return reply("barang,harga\n\n*Contoh :* Panel Unlimited,2");
          if (!text.split(",")) return reply("barang,harga\n\n*Contoh :* Panel Unlimited,2");

          // Memisahkan barang dan harga dari teks input
          const [barang,
            harga] = text.split(",");
          if (!barang || isNaN(harga)) return reply("Format input salah! Gunakan format: NamaBarang,Harga");

          const total = `${harga}000000`; // Mengonversi harga ke nominal besar
          const total2 = Number(`${harga}000`); // Mengonversi harga ke format angka
          const teks = `「 𝗧𝗥𝗔𝗡𝗦𝗔𝗞𝗦𝗜 𝗗𝗢𝗡𝗘 𝗕𝗬 𝗣𝗔𝗗𝗜𝗟𝗗𝗘𝗩 」

          📦 𝗕𝗮𝗿𝗮𝗻𝗴 : ${barang}
          💸 𝗡𝗼𝗺𝗶𝗻𝗮𝗹 : Rp${toRupiah(total2)}
          📆 𝗧𝗮𝗻𝗴𝗴𝗮𝗹: ${tanggal2}
          ⏰ 𝗪𝗮𝗸𝘁𝘂 : ${time}

          𝗧𝗲𝗿𝗶𝗺𝗮𝗸𝗮𝘀𝗶𝗵 𝗦𝘂𝗱𝗮𝗵 𝗠𝗲𝗺𝗽𝗲𝗿𝗰𝗮𝘆𝗮𝗶 & 𝗠𝗲𝗻𝗴𝗴𝘂𝗻𝗮𝗸𝗮𝗻 𝗝𝗮𝘀𝗮 𝗣𝗔𝗗𝗜𝗟𝗗𝗘𝗩`;

          // Mengirimkan pesan transaksi menggunakan relayMessage
          tiky.relayMessage(m.chat, {
            requestPaymentMessage: {
              currencyCodeIso4217: 'IDR',
              amount1000: Number(total), // Menggunakan nilai total sebagai nominal pembayaran
              requestFrom: m.sender,
              noteMessage: {
                extendedTextMessage: {
                  text: `${teks}`,
                  contextInfo: {
                    externalAdReply: {
                      showAdAttribution: true
                    }
                  }
                }
              }
            }
          }, {});
        }
        break;
      case 'proses': {
        if (!isCreator) return reply("Perintah hanya untuk owner"); // Memastikan hanya pemilik yang bisa menggunakan
        const text_trxpending = `「 𝗧𝗥𝗔𝗡𝗦𝗔𝗞𝗦𝗜 𝗣𝗘𝗡𝗗𝗜𝗡𝗚 」

        📆 𝗧𝗮𝗻𝗴𝗴𝗮𝗹: ${tanggal2}
        🕰️ 𝗪𝗮𝗸𝘁𝘂: ${time}
        ✨ 𝗦𝘁𝗮𝘁𝘂𝘀: Pending

        𝗧𝗥𝗔𝗡𝗦𝗔𝗞𝗦𝗜 𝗣𝗘𝗡𝗗𝗜𝗡𝗚
        𝗛𝗔𝗥𝗔𝗣 𝗕𝗘𝗥𝗦𝗔𝗕𝗔𝗥`;

        // Mengirimkan pesan pending menggunakan relayMessage
        await tiky.relayMessage(m.chat, {
          requestPaymentMessage: {
            currencyCodeIso4217: 'IDR',
            amount1000: 1000000,
            requestFrom: m.sender,
            noteMessage: {
              extendedTextMessage: {
                text: text_trxpending,
                contextInfo: {
                  externalAdReply: {
                    showAdAttribution: true,
                  }
                }
              }
            }
          }
        }, {});
      }
        break;
      case 'chatgpt':
        if (!isVerified(senders)) return reply(`Nomor anda belum terverifikasi di bot kami, silahkan ketik \`verify\` untuk memverifikasi nomor anda.`)
        if (!text) return tiky.sendMessage(m.chat, {
          text: 'Mau nanya apa ke ChatGPT?'
        });
        if (users[sender].limit <= 0) {
          habis()
        } else {
          handlerLimit(senders, false);
          var kolbekai = await fetchJson(`https://widipe.com/openai?text=Selalu Panggil saya ${pushname} Yak,${text}`);
          var airespon = kolbekai.result;
          tiky.sendMessage(m.chat, {
            text: `Use limit -4, sisa limit anda: ${users[senders].limit}`
          });
          setTimeout(async () => {
            let Fue = "`";
            await tiky.sendMessage(m.chat, {
              text: `*${Fue}[ Chatgpt ] :${Fue}* ${airespon}`
            });
          }, 1000);
        }
        break;
      case 'delcase': {
        if (!isCreator) return reply('Hanya creator yang bisa menghapus case.');
        if (!text) return reply('Mana case yang ingin dihapus?');

        // Nama file yang akan dimodifikasi
        const namaFile = './case.js';

        // Case yang ingin Anda hapus
        const caseToDelete = `case '${text}':`;

        // Baca isi file
        fs.readFile(namaFile, 'utf8', (err, data) => {
          if (err) {
            console.error('Terjadi kesalahan saat membaca file:', err);
            return reply('Terjadi kesalahan saat membaca file.');
          }
          const posisiCase = data.indexOf(caseToDelete);
          if (posisiCase === -1) {
            return reply(`Case '${args}' tidak ditemukan dalam file.`);
          }

          // Cari posisi break; berikutnya setelah case
          const posisiBreak = data.indexOf('break;', posisiCase);
          if (posisiBreak === -1) {
            return reply('Tidak dapat menemukan "break;" setelah case yang ingin dihapus.');
          }

          // Potong data untuk menghapus case
          const kodeBaruLengkap = data.slice(0, posisiCase) + data.slice(posisiBreak + 'break;'.length);
          fs.writeFile(namaFile, kodeBaruLengkap, 'utf8', (err) => {
            if (err) {
              console.error('Terjadi kesalahan saat menulis file:', err);
              return reply('Terjadi kesalahan saat menulis file.');
            } else {
              return reply(`Case '${text}' berhasil dihapus.`);
            }
          });
        });
      }
        break;
      case 'batal': {
        if (!isCreator) return reply("Perintah hanya untuk owner"); // Memastikan hanya pemilik yang bisa menggunakan
        const text_trxbatal = `「 𝗧𝗥𝗔𝗡𝗦𝗔𝗞𝗦𝗜 𝗗𝗜 𝗕𝗔𝗧𝗔𝗟𝗞𝗔𝗡 」

        📆 𝗧𝗮𝗻𝗴𝗴𝗮𝗹: ${tanggal2}
        🕰️ 𝗪𝗮𝗸𝘁𝘂: ${time}
        ✨ 𝗦𝘁𝗮𝘁𝘂𝘀: Di Batalkan

        𝗦𝗲𝗹𝘂𝗿𝘂𝗵 𝗧𝗿𝗮𝗻𝘀𝗮𝗸𝘀𝗶 𝗕𝗮𝘁𝗮𝗹`;

        // Mengirimkan pesan pembatalan menggunakan relayMessage
        await tiky.relayMessage(m.chat, {
          requestPaymentMessage: {
            currencyCodeIso4217: 'IDR',
            amount1000: 1000000,
            requestFrom: m.sender,
            noteMessage: {
              extendedTextMessage: {
                text: text_trxbatal,
                contextInfo: {
                  externalAdReply: {
                    showAdAttribution: true,
                  }
                }
              }
            }
          }
        }, {});
      }
        break;
      case 'setppbot': {
        if (!isCreator || !isPrem) return reply("Kamu Bukan Owner");
        if (m.quoted) {
          const media = await tiky.downloadAndSaveMediaMessage(quoted)
          const {
            img
          } = await generateProfilePicture(media)
          await tiky.query({
            tag: 'iq', attrs: {
              to: botNumber, type: 'set', xmlns: 'w:profile:picture'
            }, content: [{
                tag: 'picture', attrs: {
                  type: 'image'
                }, content: img
              }]})
          await reply(`Success`)
        } else reply("Silahkan reply foto yang anda kirim")
      }
        break
      case 'setting': {
        if (!isCreator || !isPrem) return reply("Kamu Bukan Owner");
        let sections = [{
          title: '<¡> Bot Setting <¡>',
          highlight_label: `🚀 © ${global.author}`,
          rows: [{
            title: 'Self',
            description: '<?> Bot setting self',
            id: 'self'
          },
            {
              title: 'Public',
              description: '<?> Bot setting public',
              id: 'public'
            },
            {
              title: 'Setting bio this bot',
              description: '<?> Setting bio',
              id: 'setbiobot'
            },
            {
              title: 'Delete profile this bot',
              description: '<?> Delete photo profile',
              id: 'delppbot'
            },
            {
              title: 'Setting profile this bot',
              description: '<?> Setting photo profile',
              id: 'setppbot'
            },
            {
              title: 'Auto read chat on',
              description: '<?> Auto read chat',
              id: 'autoread on'
            },
            {
              title: 'Auto read chat off',
              description: '<?> Auto read chat',
              id: 'autoread off'
            }]
        },
          {
            title: '<¡> Group Setting <¡>',
            rows: [{
              title: 'Antilink on',
              description: '<?> Antilink settings',
              id: 'antilink on'
            },
              {
                title: 'Antilink off',
                description: '<?> Antilink settings',
                id: 'antilink off'
              },
              {
                title: 'Antibad on',
                description: '<?> Antibad settings',
                id: 'antibad on'
              },
              {
                title: 'Antibad off',
                description: '<?> Antibad settings',
                id: 'antibad off'
              },
              {
                title: 'Welcome on',
                description: `<?> Welcome setting`,
                id: 'welcome on'
              },
              {
                title: 'Welcome off',
                description: "<?> welcome setting",
                id: 'welcome off'
              }]
          }];
        let listMessage = {
          title: 'Setting ⚙️',
          sections: sections
        };
        let maghg = generateWAMessageFromContent(m.chat, {
          viewOnceMessage: {
            message: {
              interactiveMessage: proto.Message.InteractiveMessage.create({
                contextInfo: {
                  mentionedJid: [m?.sender],
                  isForwarded: true,
                  forwardedNewsletterMessageInfo: {
                    newsletterJid: '1203633028651915244@newsletter',
                    newsletterName: `${global.botname}`,
                    serverMessageId: -1
                  },
                  businessMessageForwardInfo: {
                    businessOwnerJid: tiky.decodeJid(tiky.user.id)
                  },
                  externalAdReply: {
                    title: global.title,
                    body: global.body,
                    sourceUrl: global.sourceurl
                  }
                },
                body: proto.Message.InteractiveMessage.Body.create({
                  text: "Silahkan klik tombol di bawah untuk setting"
                }),
                footer: proto.Message.InteractiveMessage.Footer.create({
                  text: `© ${global.footer}`
                }),
                header: proto.Message.InteractiveMessage.Header.create({
                  title: ``,
                  subtitle: "Padz Store",
                  hasMediaAttachment: true,
                  ...(await prepareWAMessageMedia( {
                    document: fs.readFileSync('./package.json'),
                    mimetype: "application/msword",
                    fileLength: 99999999999999,
                    fileName: global.filename
                  }, {
                    upload: tiky.waUploadToServer
                  }))
                }),
                gifPlayback: true,
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                  buttons: [{
                    name: "single_select",
                    buttonParamsJson: JSON.stringify(listMessage)
                  }]
                })
              })
            }
          }
        }, {
          quoted: contactOwner
        });
        await tiky.relayMessage(maghg.key.remoteJid, maghg.message, {
          messageId: maghg.key.id
        });
      }
        break;
      case "verify": {
        // Tambahkan pengguna jika belum ada
        addUser(senders);

        // Cek jika pengguna sudah terverifikasi
        if (isVerified(senders)) {
          reply('Akun Anda sudah terverifikasi.');
          return;
        }

        // Ambil serial key dan tanggal
        const dateAdded = users[senders].dateAdded;
        const userSerialKey = users[senders].serialKey;

        // Tandai pengguna sebagai terverifikasi
        users[senders].verified = true;

        // Simpan perubahan ke database
        fs.writeFileSync('./database/user.json', JSON.stringify(users, null, 2));

        // Kirim pesan sukses verifikasi
        reply(`Verifikasi berhasil!\nStatus: Terverifikasi\nSerial Key: ${userSerialKey}\nTanggal Ditambahkan: ${dateAdded}`);
      }
        break;
      case 'resetlinkgc': {
        if (!isCreator || !isPrem) return reply("Kamu Bukan Owner");
        if (!m.isGroup) return reply("Hanya di group")
        if (!isBotAdmins) return reply("Bot bukan admin")
        tiky.groupRevokeInvite(from)
      }
        break
      case 'susunkata': {
        let timeout = 60000;
        let poin = 50;
        if (senders in tiky.susunkata) return reply('Soal yang di berikan sebelumnya belum terjawab.\nSilahkan jawab dan selesaikan terlebih dahulu sebelum mengambil soal lagi.');
        let src = await (await fetch(`${global.baseurl}susunkata.json`)).json();
        let json = src[Math.floor(Math.random() * src.length)];
        let pard = '`';
        let caption = `
        ${pard}GAME DI MULAI DARI SEKARANG${pard}


        Soal: ${json.soal}
        Tipe Soal: ${json.tipe}

        > NOTE: ${pard}Kamu mempunyai waktu 60 detik untuk menjawab soal tersebut dan kamu akan mendapatkan 50 point jika jawaban benar jika jawaban salah akan di kurangi 15 point${pard}`.trim();
        tiky.susunkata[m.sender] = [
          await reply(`${caption}`),
          json,
          poin,
          setTimeout(() => {
            // Jawaban salah, kurangi poin dan kirim pesan gagal
            handlerPoint(senders, false); // Panggil handlerPoint jika jawaban salah
            reply(`${pard}GAME TELAH BERAKHIR${pard}\n> Jawaban: *${json.jawaban}*`);
            delete tiky.susunkata[m.sender];
          }, timeout)
        ];
      }
        break;
      case 'addprem': {
        if (!isCreator || !isPrem) return reply('Fitur khusus owner')
        const swn = args.join(" ")
        const pcknm = swn.split(",")[0];
        const atnm = swn.split(",")[1];
        if (!pcknm) return reply(`Penggunaan :\n*${prefix}addprem* @tag|waktu\n*${prefix}addprem* nomor|waktu\n\nContoh : ${command} @tag|30d`)
        if (!atnm) return reply(`Mau yang berapa hari?`)
        let users = m.quoted ? m.quoted.sender: text.replace(/[^0-9]/g, '')+'@s.whatsapp.net'
        if (users) {
          prem.addPremiumUser((pcknm.replace('@', '')+'@s.whatsapp.net').replace(' @', '@'), atnm, premium)
          reply('Sudah aku add ownerku')
        } else {
          var cekap = await tiky.onWhatsApp(pcknm+"@s.whatsapp.net")
          if (cekap.length == 0) return reply(`Masukkan nomer yang valid/terdaftar di WhatsApp`)
          prem.addPremiumUser((pcknm.replace('@', '')+'@s.whatsapp.net').replace(' @', '@'), atnm, premium)
          reply('Sudah aku add ownerku')
        }}
        break
      case 'delprem': {
        if (!isCreator || !isPrem) return reply('Fitur khusus owner')
        if (!args[0]) return reply(`Penggunaan :\n*${prefix}delprem* @tag\n*${prefix}delprem* nomor`)
        let users = m.quoted ? m.quoted.sender: text.replace(/[^0-9]/g, '')+'@s.whatsapp.net'
        if (users) {
          premium.splice(prem.getPremiumPosition(users, premium), 1)
          fs.writeFileSync('./database/premium.json', JSON.stringify(premium))
          reply('User premium telah di hapus')
        } else {
          var cekpr = await tiky.onWhatsApp(args[0]+"@s.whatsapp.net")
          if (cekpr.length == 0) return reply(`Masukkan nomer yang valid/terdaftar di WhatsApp`)
          premium.splice(prem.getPremiumPosition(args[0] + '@s.whatsapp.net', premium), 1)
          fs.writeFileSync('./src/database/premium.json', JSON.stringify(premium))
          reply('User premium telah di hapus')
        }}
        break
      case 'listprem': {
        if (!isCreator || !isPrem) return reply('Fitur khusus owner')
        let txt = `*List Premium User*\nJumlah : ${premium.length}\n\n`
        let men = [];
        for (let i of premium) {
          men.push(i.id)
          txt += `*ID :* @${i.id.split("@")[0]}\n`
          if (i.expired === 'PERMANENT') {
            let cekvip = 'PERMANENT'
            txt += `*Expire :* PERMANENT\n\n`
          } else {
            let cekvip = readTime(i.expired - Date.now())
            txt += `*Expire :* ${cekvip.days} day(s) ${cekvip.hours} hour(s) ${cekvip.minutes} minute(s) ${cekvip.seconds} second(s)\n\n`
          }
        }
        tiky.sendTextWithMentions(m.chat, txt, m)
      }
        break
      case 'buypanel':
        reply('Mohon maaf, fitur ini sudah tidak tersedia lagi.')
        //         let kates = generateWAMessageFromContent(m.chat, {
        //           viewOnceMessage: {
        //             message: {
        //               "messageContextInfo": {
        //                 "deviceListMetadata": {},
        //                 "deviceListMetadataVersion": 2
        //               },
        //               interactiveMessage: proto.Message.InteractiveMessage.create({
        //                 contextInfo: {
        //                   mentionedJid: [m?.sender],
        //                   isForwarded: true,
        //                   externalAdReply: {
        //                     title: global.title,
        //                     body: global.body,
        //                     thumbnail: fs.readFileSync('./thumbnail/thumbnail.jpg'),
        //                     sourceUrl: global.sourceurl
        //                   }
        //                 },
        //                 body: proto.Message.InteractiveMessage.Body.create({
        //                   text: 'Silahkan klik tombol di bawah untuk order panel!'
        //                 }),
        //                 footer: proto.Message.InteractiveMessage.Footer.create({
        //                   text: `© ${footer}`
        //                 }),
        //                 header: proto.Message.InteractiveMessage.Header.create({
        //                   title: `${global.botname}`,
        //                   subtitle: "Padz Store",
        //                   hasMediaAttachment: true,
        //                   ...(await prepareWAMessageMedia( {
        //                     document: fs.readFileSync('./package.json'),
        //                     mimetype: "application/msword",
        //                     fileLength: 99999999999999,
        //                     fileName: global.filename,
        //                   }, {
        //                     upload: tiky.waUploadToServer
        //                   }))
        //                 }),
        //                 gifPlayback: true,
        //                 nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
        //                   buttons: [{
        //                     "name": "cta_url",
        //                     "buttonParamsJson": "{\"display_text\":\"Click Here\",\"url\":\"https://padz-store.vercel.app\",\"merchant_url\":\"https://padz-store.vercel.app\"}"
        //                   }]
        //                 })
        //               })
        //             }
        //           }
        //         }, {
        //           quoted: contactOwner
        //         });
        //
        //         await tiky.relayMessage(kates.key.remoteJid, kates.message, {
        //           messageId: kates.key.id
        //         });
        break
      case "menu":
        let textnya = `${treeify.asTree(commandTree, true)}`;
        let sections = [{
          title: '<¡> Main Menu <¡>',
          highlight_label: `🚀 © ${global.author}`,
          rows: [{
            title: 'Verify 🔓',
            description: "<?> User Registration",
            id: `verify`
          }]
        }]

        let listMsgh = {
          title: 'Click Here',
          sections
        };

        let maghg = generateWAMessageFromContent(m.chat, {
          viewOnceMessage: {
            message: {
              "messageContextInfo": {
                "deviceListMetadata": {},
                "deviceListMetadataVersion": 2
              },
              interactiveMessage: proto.Message.InteractiveMessage.create({
                contextInfo: {
                  mentionedJid: [m?.sender],
                  externalAdReply: {
                    showAdAttribution: true,
                    title: global.botname,
                    body: global.author,
                    thumbnail: fs.readFileSync('./thumbnail/thumbnail.jpg'),
                    sourceUrl: global.sourceurl,
                    mediaType: 1,
                  }
                },
                body: proto.Message.InteractiveMessage.Body.create({
                  text: textnya
                }),
                footer: proto.Message.InteractiveMessage.Footer.create({
                  text: `© ${footer}`
                }),
                header: proto.Message.InteractiveMessage.Header.create({
                  title: `${global.botname}`,
                  subtitle: "Padz Store",
                  hasMediaAttachment: true,
                  ...(await prepareWAMessageMedia( {
                    document: fs.readFileSync('./package.json'),
                    mimetype: "application/msword",
                    fileLength: 99999999999999,
                    fileName: global.filename,
                  }, {
                    upload: tiky.waUploadToServer
                  }))
                }),
                gifPlayback: true,
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                  buttons: [{
                    "name": "single_select",
                    "buttonParamsJson": JSON.stringify(listMsgh)
                  },
                    {
                      "name": "quick_reply",
                      "buttonParamsJson": "{\"display_text\":\"Upgrade to Premium\",\"id\":\"notice\"}"
                    }]
                })
              })
            }
          }
        }, {
          quoted: contactOwner
        });

        await tiky.relayMessage(maghg.key.remoteJid, maghg.message, {
          messageId: maghg.key.id
        });
        break;
      case 'disk': {
        if (!isVerified(senders)) return reply(`Nomor anda belum terverifikasi di bot kami, silahkan ketik \`verify\` untuk memverifikasi nomor anda.`)
        exec('cd && du -h --max-depth=1', (err, stdout) => {
          if (err) return reply(`${err}`)
          if (stdout) return reply(stdout)
        })
      }
        break
      case 'notice':
        let fqdn = '`'
        reply(`${fqdn}[ SYSTEM ]${fqdn}: Jika saldo habis dan ingin deposit dll, silahkan ketik ${fqdn}owner${fqdn} untuk menghubungi owner.`)
        break
      case 'owner': {
        const kontak = {
          "displayName": global.author,
          vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;;;;\nFN: ${global.author}\nitem1.TEL;waid=${global.owner}:${global.owner}\nitem1.X-ABLabel:\nTolong jangan melakukan spam terhadap ownerku\nURL;Email:padild940@gmail.com\nORG:${global.filename}\nEND:VCARD`
        }
        await tiky.sendMessage(from,
          {
            contacts: {
              contacts: [kontak]
            },
            contextInfo: {
              forwardingScore: 999,
              isForwarded: false,
              mentionedJid: [sender],
              "externalAdReply": {
                "showAdAttribution": true,
                "renderLargerThumbnail": true,
                "title": Styles(`Ini ownerku beliau anak introvert`),
                "containsAutoReply": true,
                "mediaType": 1,
                "jpegThumbnail": fs.readFileSync('./thumbnail/thumbnail.jpg'),
                "mediaUrl": `https://chat.whatsapp.com/HJB6pgpeCjDGHzuy8C1r6a`,
                "sourceUrl": `https://chat.whatsapp.com/HJB6pgpeCjDGHzuy8C1r6a`
              }
            }
          },
          {
            quoted: contactOwner
          })
      }
        break
      case 'getcase':
        if (!isCreator || !isPrem) return reply("Kamu Bukan Owner");
        if (!q) return reply(`Contoh penggunaan: ${command} menu`)
        const getcase = (cases) => {
          return "case "+`'${cases}'`+fs.readFileSync('./case.js').toString().split('case \''+cases+'\'')[1].split("break")[0]+"break"
        }
        reply(`${getcase(q)}`)
        break
      case 'hd': {
        // Cek apakah pengguna sudah diverifikasi
        if (!isVerified(senders)) {
          return reply(`Nomor anda belum terverifikasi di bot kami, silahkan ketik \`verify\` untuk memverifikasi nomor anda.`);
        }

        // Cek apakah limit pengguna sudah habis
        if (users[sender].limit <= 0) {
          habis()
        } else {
          // Cek apakah pengguna mengirimkan atau me-reply gambar
          if (!quoted) return reply('Di mana gambar yang ingin diubah menjadi HD?');
          if (!/image/.test(mime)) return reply(`Silakan kirim/reply foto dengan caption ${command}`);

          const {
            hdin
          } = require('./lib/hd');
          let media = await quoted.download();
          let proses = await hdin(media, "enhance");
          let proses2 = proses;
          let hade = await hdin(proses2, "enhance");
          handlerLimit(senders, false);

          // Kirim gambar hasil HD
          tiky.sendMessage(m.chat, {
            image: hade,
            caption: `Gambar HD berhasil, berikut hasilnya\n\nSisa limit: ${users[senders].limit}`
          }, {
            quoted: contactOwner
          });
        }
      }
        break;
      case 'dels': {
        if (!isCreator || !isPrem) return reply("Kamu bukan ownerku")
        fs.readdir("./sessions", async function(err, files) {
          if (err) {
            console.log('Unable to scan directory: ' + err);
            return reply('Unable to scan directory: ' + err);
          }
          let filteredArray = await files.filter(item => item.startsWith("pre-key") ||
            item.startsWith("sender-key") || item.startsWith("session-") || item.startsWith("app-state")
          )
          console.log(filteredArray.length);
          let teks = `Maaf ownerku, tidak ada session untuk hari ini`
          if (filteredArray.length == 0) return reply(teks)
          filteredArray.map(function(e, i) {
            teks += (i + 1) + `. ${e}\n`
          })
          await filteredArray.forEach(function(file) {
            fs.unlinkSync(`./sessions/${file}`)
          });
          await sleep(2000)
          reply("Beres semua ownerku")
        });
      }
        break
      case 'toimage': case 'toimg': {
        if (!isVerified(senders)) {
          return reply(`Nomor anda belum terverifikasi di bot kami, silahkan ketik \`verify\` untuk memverifikasi nomor anda.`);
        }
        if (!quoted) reply ('Apasih?')
        if (!/webp/.test(mime) && !/png/.test(mime) && !/jpg/.test(mime)) reply (`Balas sticker dengan caption *${command}*`)
        if (users[sender].limit <= 0) {
          habis()
        } else {
          handlerLimit(senders, false);
          let media = await tiky.downloadAndSaveMediaMessage(quoted)
          let ran = 'result.png'
          exec(`ffmpeg -i ${media} ${ran}`, (err) => {
            fs.unlinkSync(media)
            if (err) reply (err)
            let buffer = fs.readFileSync(ran)
            tiky.sendMessage(m.chat, {
              image: buffer,
              caption: `Created By ${global.botname}`
            }, {
              quoted: contactOwner
            })
            fs.unlinkSync(ran)
          })
        }
      }
        break
      case 'qc': {
        if (!isVerified(senders)) {
          return reply(`Nomor anda belum terverifikasi di bot kami, silahkan ketik \`verify\` untuk memverifikasi nomor anda.`);
        }
        let text;
        if (args.length >= 1) {
          text = args.slice(0).join(" ");
        } else if (m?.quoted && m?.quoted.text) {
          text = m?.quoted.text;
        } else {
          reply("Input teks atau reply teks yang ingin di jadikan quote!");
        }
        if (!text) return reply('masukan text');
        if (text.length > 30) return reply('Maksimal 30 Teks!');
        if (users[sender].limit <= 0) {
          habis()
        } else {
          handlerLimit(senders, false);
          let ppnyauser = await tiky.profilePictureUrl(m?.sender, 'image').catch(_ => 'https://telegra.ph/file/6880771a42bad09dd6087.jpg');
          const rest = await quote(text, pushname, ppnyauser);
          tiky.sendImageAsSticker(m?.chat, rest.result, contactOwner, {
            packname: global.botname,
            author: global.author
          });
        }
      }
        break;
      case 'sticker':
      case 'stiker':
      case 's': {
          if (!isVerified(senders)) {
            return reply(`Nomor anda belum terverifikasi di bot kami, silahkan ketik \`verify\` untuk memverifikasi nomor anda.`);
          }
          if (!quoted) return reply(`Image Dengan Caption ${command}`);
          if (users[sender].limit <= 0) {
            habis()
          } else {
            handlerLimit(senders, false);
            if (/image/.test(mime)) {
              let media = await quoted.download();
              let encmedia = await tiky.sendImageAsSticker(m?.chat, media, m, {
                packname: global.botname,
                author: global.author
              });
              await fs.unlinkSync(encmedia);

            } else {
              return reply(`Kirim Gambar Dengan Caption ${command}`);
            }
          }
        }
        break;
      default:
        if (budy.startsWith(command)) {
          if (!isVerified(senders)) return
          if (users[senders].xp == 100000) {
            return true
          } else {
            addXp(reply, senders, 10)
          }
        }
        if (budy.startsWith('$')) {
          if (!isCreator) return
          exec(budy.slice(2), (err, stdout) => {
            if (err) return reply(`${err}`)
            if (stdout) return reply(stdout)
          })
        }
        let chihuyy = '`'
        const code = Object.keys(referralData).find(code => budy.startsWith(code));

        if (code) {
          if (!referralData[code]) {
            reply("Kode referral tidak valid.");
            return;
          } else if (!referralData[code].active) {
            reply("Kode referral ini sudah pernah digunakan oleh Anda.");
            return;
          }

          if (!users[senders].usedReferrals) {
            users[senders].usedReferrals = []; // Membuat array jika `usedReferrals` belum ada
          }

          // Tambahkan poin ke pengguna dan tandai referral sebagai sudah digunakan
          const points = referralData[code].points;
          users[senders].point += points;
          users[senders].usedReferrals.push(code);
          referralData[code].active = false;

          // Simpan perubahan ke file JSON
          fs.writeFileSync('./database/user.json', JSON.stringify(users, null, 2));
          fs.writeFileSync('./database/referrals.json', JSON.stringify(referralData, null, 2));
          reply(`Kode referral ${chihuyy}${code}${chihuyy} berhasil digunakan oleh @${senders.split('@')[0]}. Mendapatkan ${points} poin dan exp 5.`);
          if (users[senders].xp == 100000) {
            return true
          } else {
            addXp(reply, senders, 10)
          }
          delete referralData[code];
        }
      }
    } catch (err) {
      console.log(err)
    }
  };

  let file = require.resolve(__filename);
  fs.watchFile(file,
    () => {
      fs.unwatchFile(file);
      console.log(chalk.redBright(`Update ${__filename}`));
      delete require.cache[file];
      require(file);
    });