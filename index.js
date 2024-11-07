require('./config')
const {
  default: makeWASocket,
    getAggregateVotesInPollMessage,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    jidDecode,
    proto,
    getContentType,
    downloadContentFromMessage,
    fetchLatestWaWebVersion
  } = require("@whiskeysockets/baileys");
  const {
    smsg,
    color,
    getBuffer
  } = require("./lib/function")
  const {
    imageToWebp,
    writeExifImg
  } = require('./lib/exec')
  const {
    Boom
  } = require("@hapi/boom");
  const Pino = require("pino");
  const FileType = require('file-type')
  const fs = require('fs');
  const path = require('path')
  const moment = require('moment');
  const chalk = require("chalk");
  const cfonts = require('cfonts');
  const NodeCache = require("node-cache");
  const PhoneNumber = require("awesome-phonenumber");
  const yargs = require('yargs/yargs')
  const msgRetryCounterCache = new NodeCache();
  const useCode = true
  const store = makeInMemoryStore( {
    logger: Pino().child({
      level: "silent", stream: "store"
    })
  });
  global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())

  async function connect() {
    const {
      state,
      saveCreds
    } = await useMultiFileAuthState("sessions");
    const tiky = makeWASocket( {
      logger: Pino( {
        level: "silent"
      }),
      printQRInTerminal: !useCode,
      auth: state,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 0,
      keepAliveIntervalMs: 10000,
      emitOwnEvents: true,
      fireInitQueries: true,
      generateHighQualityLinkPreview: true,
      syncFullHistory: true,
      markOnlineOnConnect: true,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      getMessage: async (key) => {
        if (store) {
          const msg = await store.loadMessage(key.remoteJid, key.id)
          return msg.message
        }
      },
    });

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

    if (useCode && !tiky.user && !tiky.authState.creds.registered) {
      async function koplak() {
        const readline = require("readline").createInterface({
          input: process.stdin,
          output: process.stdout
        });
        const question = (text) => new Promise((resolve) => {
          readline.question(text, (answer) => {
            resolve(answer);
            readline.close();
          });
        });
        let phoneNumber = await question("Masukkan nomor HP diawali dengan 62: ");
        try {
          let code = await tiky.requestPairingCode(phoneNumber);
          code = code?.match(/.{1,4}/g).join("-") || code;
          console.log("Kode pairing anda - " + "[ " + chalk.bgBlueBright(code) + " ]");
        } catch (err) {
          console.log("Terjadi error saat mengambil kode pairing" + chalk.bgRed(err));
        }
      }
      await koplak();
    }

    function createTmpFolder() {
      const folderName = "tmp";
      const folderPath = path.join(__dirname,
        folderName);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
        //console.log(chalk.blue(`Folder '${folderName}' berhasil dibuat.`))
      } else {
        //console.log(chalk.blue((`Folder '${folderName}' sudah ada.`))
      }
    }
    createTmpFolder();

    tiky.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
      let quoted = message.msg ? message.msg: message;
      let mime = (message.msg || message).mimetype || '';
      let messageType = message.mtype ? message.mtype.replace(/Message/gi, ''): mime.split('/')[0];
      const stream = await downloadContentFromMessage(quoted, messageType);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      let type = await FileType.fromBuffer(buffer);
      let trueFileName = attachExtension ? (filename + '.' + type.ext): filename;
      let savePath = path.join(__dirname, 'tmp', trueFileName); // Save to 'tmp' folder
      await fs.writeFileSync(savePath, buffer);
      return savePath;
    };

    tiky.getFile = async (PATH,
      returnAsFilename) => {
      let res,
      filename
      const data = Buffer.isBuffer(PATH) ? PATH: /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1],
        'base64'): /^https?:\/\//.test(PATH) ? await (res = await fetch(PATH)).buffer(): fs.existsSync(PATH) ? (filename = PATH,
        fs.readFileSync(PATH)): typeof PATH === 'string' ? PATH: Buffer.alloc(0)
      if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
      const type = await FileType.fromBuffer(data) || {
        mime: 'application/octet-stream',
        ext: '.bin'
      }
      if (data && returnAsFilename && !filename) (filename = path.join(__dirname, './tmp/' + new Date * 1 + '.' + type.ext), await fs.promises.writeFile(filename, data))
        return {
        res,
        filename,
        ...type,
        data,
        deleteFile() {
          return filename && fs.promises.unlink(filename)
        }
      }
    }

    tiky.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
      let buff = Buffer.isBuffer(path) ? path: /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64'): /^https?:\/\//.test(path) ? await (await getBuffer(path)): fs.existsSync(path) ? fs.readFileSync(path): Buffer.alloc(0)
      let buffer
      if (options && (options.packname || options.author)) {
        buffer = await writeExifImg(buff, options)
      } else {
        buffer = await imageToWebp(buff)
      }
      await tiky.sendMessage(jid, {
        sticker: {
          url: buffer
        }, ...options
      }, {
        quoted
      })
      return buffer
    }

    tiky.downloadMediaMessage = async (message) => {
      let mime = (message.msg || message).mimetype || ''
      let messageType = message.mtype ? message.mtype.replace(/Message/gi,
        ''): mime.split('/')[0]
      const stream = await downloadContentFromMessage(message,
        messageType)
      let buffer = Buffer.from([])
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }
      return buffer
    }

    tiky.sendImage = async (jid, path, caption = '', quoted = '', options) => {
      let buffer = Buffer.isBuffer(path) ? path: /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64'): /^https?:\/\//.test(path) ? await (await getBuffer(path)): fs.existsSync(path) ? fs.readFileSync(path): Buffer.alloc(0)
      return await tiky.sendMessage(jid, {
        image: buffer, caption: caption, ...options
      }, {
        quoted
      })
    }

    // Sambutan owner dan premium user
    let ownerJid = '6285867760406@s.whatsapp.net';
    let lastGreetTime = 0;
    const greetInterval = 15 * 60 * 1000;
    let ownerGreeted = false;

    tiky.ev.on("messages.upsert", async (chatUpdate) => {
      const mek = chatUpdate.messages[0];
      if (!mek.message) return;
      // if (mek.key.fromMe) return;
      if (mek.key && mek.key.remoteJid === 'status@broadcast') {
        await tiky.readMessages([mek.key]);
      }

      const now = new Date().getTime();
      if (mek.key.participant === ownerJid) {
        if (!ownerGreeted || (now - lastGreetTime > greetInterval)) {
          await tiky.sendMessage(mek.key.remoteJid, {
            document: fs.readFileSync("./database/Docu/PadilDev.docx"),
            fileName: global.filename,
            mimetype: 'application/msword',
            fileLength: 99999999999999,
            caption: "ꜱᴇʟᴀᴍᴀᴛ ᴅᴀᴛᴀɴɢ, ᴏᴡɴᴇʀᴋᴜ!"
          }, {
            quoted: contactOwner
          });
          lastGreetTime = now;
          ownerGreeted = true;
        }
      }
      const m = smsg(tiky, mek, store);
      require("./case.js")(tiky, m, chatUpdate, store);
    });
    tiky.sendTextWithMentions = async (jid, text, quoted, options = {}) => tiky.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted })
    tiky.sendTextWithMentions = async (jid,
      text,
      quoted,
      options = {}) => tiky.sendMessage(jid,
      {
        text: text,
        contextInfo: {
          mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net')
        },
        ...options
      },
      {
        quoted
      })
    tiky.decodeJid = (jid) => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        let decode = jidDecode(jid) || {};
        return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
      } else return jid;
    };

    tiky.getName = (jid, withoutContact = false) => {
      // Pastikan 'id' dan 'jid' adalah string
      let id = String(tiky.decodeJid(jid));
      jid = String(jid); // Pastikan jid adalah string sebelum menggunakan replace

      withoutContact = tiky.withoutContact || withoutContact;
      let v;

      if (id.endsWith("@g.us")) {
        return new Promise(async (resolve) => {
          v = store.contacts[id] || {};
          if (!(v.name || v.subject)) v = await tiky.groupMetadata(id) || {};
          resolve(v.name || v.subject || PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber("international"));
        });
      } else {
        v = id === "0@s.whatsapp.net"
        ? {
          id,
          name: "WhatsApp"
        }: id === tiky.decodeJid(tiky.user.id)
        ? tiky.user: store.contacts[id] || {};

        return (withoutContact ? "": v.name) || v.subject || v.verifiedName || PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international");
      }
    };

    tiky.serializeM = (m) => smsg(tiky, m, store)

    tiky.sendContact = async (jid, kon, quoted = '', opts = {}) => {
      let list = []
      for (let i of kon) {
        list.push({
          displayName: await tiky.getName(i),
          vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await tiky.getName(i)}\nFN:${await tiky.getName(i)}\nitem1.TEL;waid=${i.split('@')[0]}:${i.split('@')[0]}\nitem1.X-ABLabel:Mobile\nEND:VCARD`
        })
      }
      tiky.sendMessage(jid, {
        contacts: {
          displayName: `${list.length} Contact`, contacts: list
        }, ...opts
      }, {
        quoted
      })
    }

    tiky.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
      let type = await tiky.getFile(path, true)
      let {
        res,
        data: file,
        filename: pathFile
      } = type
      if (res && res.status !== 200 || file.length <= 65536) {
        try {
          throw {
            json: JSON.parse(file.toString())
          }
        }
        catch (e) {
          if (e.json) throw e.json
        }
      }
      let opt = {
        filename
      }
      if (quoted) opt.quoted = quoted
      if (!type) options.asDocument = true
      let mtype = '',
      mimetype = type.mime,
      convert
      if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker'
      else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image'
      else if (/video/.test(type.mime)) mtype = 'video'
      else if (/audio/.test(type.mime)) (
        convert = await (ptt ? toPTT: toAudio)(file, type.ext),
        file = convert.data,
        pathFile = convert.filename,
        mtype = 'audio',
        mimetype = 'audio/ogg; codecs=opus'
      )
        else mtype = 'document'
      if (options.asDocument) mtype = 'document'

      let message = {
        ...options,
        caption,
        ptt,
        [mtype]: {
          url: pathFile
        },
        mimetype
      }
      let m
      try {
        m = await tiky.sendMessage(jid, message, {
          ...opt, ...options
        })
      } catch (e) {
        console.error(e)
        m = null
      } finally {
        if (!m) m = await tiky.sendMessage(jid, {
          ...message, [mtype]: file
        }, {
          ...opt, ...options
        })
        return m
      }
    }

    tiky.ev.on('group-participants.update',
      async (anu) => {
        if (global.welcome) {
          try {
            const padz = '`';
            let metadata = await tiky.groupMetadata(anu.id);
            let participants = anu.participants;

            for (let num of participants) {
              let pushname = num.split('@')[0];
              try {
                ppuser = await tiky.profilePictureUrl(num, 'image')
              } catch {
                ppuser = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png?q=60'
              }

              const quotedMessage = {
                key: {
                  fromMe: false,
                  participant: '0@s.whatsapp.net',
                  remoteJid: 'status@broadcast' // Simulasi kontak resmi WhatsApp
                },
                message: {
                  contactMessage: {
                    displayName: pushname,
                    // Menggunakan nama yang didapatkan
                    vcard: 'BEGIN:VCARD\n' +
                    'VERSION:3.0\n' +
                    'FN:WhatsApp\n' +
                    'ORG:WhatsApp Official;\n' +
                    'END:VCARD'
                  }
                }
              };

              if (anu.action == 'add') {
                let text1 = `Hii @${num.split("@")[0]},\nWelcome To ${metadata.subject}`
                tiky.sendMessage(anu.id, {
                  document: fs.readFileSync('./database/Docu/PadilDev.docx'),
                  thumbnailUrl: ppuser,
                  mimetype: 'application/pdf',
                  fileLength: 99999,
                  pageCount: '100',
                  fileName: global.filename,
                  caption: text1,
                  contextInfo: {
                    mentionedJid: [m?.sender],
                    externalAdReply: {
                      showAdAttribution: true,
                      title: `${metadata.subject}`,
                      body: global.botname,
                      thumbnailUrl: ppuser,
                      sourceUrl: global.sourceurl,
                      mediaType: 1,
                      renderLargerThumbnail: true
                    }
                  }
                }, {
                  quoted: quotedMessage
                })
              } else if (anu.action == 'remove') {
                let text2 = `GoodBye @${num.split("@")[0]} 👋\nLeaving From ${metadata.subject}`
                tiky.sendMessage(anu.id, {
                  document: fs.readFileSync('./database/Docu/PadilDev.docx'),
                  thumbnailUrl: ppuser,
                  mimetype: 'application/pdf',
                  fileLength: 99999,
                  pageCount: '100',
                  fileName: global.filename,
                  caption: text2,
                  contextInfo: {
                    mentionedJid: [m?.sender],
                    externalAdReply: {
                      showAdAttribution: true,
                      title: `${metadata.subject}`,
                      body: global.botname,
                      thumbnailUrl: ppuser,
                      sourceUrl: global.sourceurl,
                      mediaType: 1,
                      renderLargerThumbnail: true
                    }
                  }
                }, {
                  quoted: quotedMessage
                })
              } else if (anu.action == 'promote') {
                let text3 = `Congratulations @${num.split("@")[0]}, on being promoted to admin of this group ${metadata.subject} 🎉`
                tiky.sendMessage(anu.id, {
                  document: fs.readFileSync('./database/Docu/PadilDev.docx'),
                  thumbnailUrl: ppuser,
                  mimetype: 'application/pdf',
                  fileLength: 99999,
                  pageCount: '100',
                  fileName: global.filename,
                  caption: text3,
                  contextInfo: {
                    mentionedJid: [m?.sender],
                    externalAdReply: {
                      showAdAttribution: true,
                      title: `${metadata.subject}`,
                      body: global.botname,
                      thumbnailUrl: ppuser,
                      sourceUrl: global.sourceurl,
                      mediaType: 1,
                      renderLargerThumbnail: true
                    }
                  }
                }, {
                  quoted: quotedMessage
                })
              } else if (anu.action == 'demote') {
                let text4 = `Congratulations @${num.split("@")[0]}, on being demote to admin of this group ${metadata.subject} 🎉`
                tiky.sendMessage(anu.id, {
                  document: fs.readFileSync('./database/Docu/PadilDev.docx'),
                  thumbnailUrl: ppuser,
                  mimetype: 'application/pdf',
                  fileLength: 99999,
                  pageCount: '100',
                  fileName: global.filename,
                  caption: text4,
                  contextInfo: {
                    mentionedJid: [m?.sender],
                    externalAdReply: {
                      showAdAttribution: true,
                      title: `${metadata.subject}`,
                      body: global.botname,
                      thumbnailUrl: ppuser,
                      sourceUrl: global.sourceurl,
                      mediaType: 1,
                      renderLargerThumbnail: true
                    }
                  }
                }, {
                  quoted: quotedMessage
                })
              }
            }
          } catch (err) {
            console.log('Error in processing group participant update: ', err);
          }
        }
      });
    tiky.public = true
    tiky.ev.on("connection.update",
      contol => {
        const {
          connection,
          lastDisconnect
        } = contol;
        try {
          if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode
            if (reason === DisconnectReason.badSession) {
              console.log(`Bad Session File, Please Delete Session and Verifikasi Again`); tiky.logout();
            } else if (reason === DisconnectReason.connectionClosed) {
              console.log("Connection closed, reconnecting...."); connect();
            } else if (reason === DisconnectReason.connectionLost) {
              console.log("Connection Lost from Server, reconnecting..."); connect();
            } else if (reason === DisconnectReason.connectionReplaced) {
              console.log("Connection Replaced, Another New Session Opened, Please Close Current Session First"); tiky.logout();
            } else if (reason === DisconnectReason.loggedOut) {
              console.log(`Device Logged Out, Please Verifikasi Again And Run.`); tiky.logout();
            } else if (reason === DisconnectReason.restartRequired) {
              console.log("Restart Required, Restarting...");
              console.clear()
              connect();
            } else if (reason === DisconnectReason.timedOut) {
              console.log("Connection TimedOut, Reconnecting..."); connect();
            } else tiky.end(`Unknown DisconnectReason: ${reason}|${connection}`)
          } if (contol.connection == "open" || contol.receivedPendingNotifications == "true") {
            console.clear();
            let cxdf = JSON.stringify(tiky.user, null, 2)
            let cxdf2 = cxdf.replace("{", '')
            .replace(/"/g, '');

            const cxdf3 = cxdf2.replace("}", '')
            setTimeout(() => {
              return tiky.sendMessage("6285867760406@s.whatsapp.net", {
                text: `${global.botname} berhasil terhubung ke ${tiky.user.id.split(":")[0]}`
              }, {
                quoted: contactOwner
              })
            }, 10000)
          }
        } catch (err) {
          console.log('Error Di Connection.update ' + err)
        }
      });

    tiky.ev.on("creds.update",
      saveCreds);

    tiky.sendText = (jid,
      text,
      quoted = '',
      options) => tiky.sendMessage(jid,
      {
        text: text,
        ...options
      },
      {
        quoted
      })
    return tiky;
  };
  connect()

  let file = require.resolve(__filename);
  fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`Update ${__filename}`));
    delete require.cache[file];
    require(file);
  });
