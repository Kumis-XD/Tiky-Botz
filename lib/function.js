const {
  proto,
  delay,
  getContentType,
  areJidsSameUser,
  generateWAMessage
} = require('@whiskeysockets/baileys')
const chalk = require('chalk')
const axios = require('axios');
const {
  sizeFormatter
} = require('human-readable');
const fs = require("fs");

exports.sleep = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

exports.bytesToSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0: decimals;
  const sizes = ['Bytes',
    'KB',
    'MB',
    'GB',
    'TB',
    'PB',
    'EB',
    'ZB',
    'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

exports.checkBandwidth = async () => {
  let ind = 0;
  let out = 0;
  for (let i of await require("node-os-utils").netstat.stats()) {
    ind += parseInt(i.inputBytes);
    out += parseInt(i.outputBytes);
  }
  return {
    download: exports.bytesToSize(ind),
    upload: exports.bytesToSize(out),
  };
};

exports.formatSize = (bytes) => {
  const sizes = ['Bytes',
    'KB',
    'MB',
    'GB',
    'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
};

exports.runtime = function (seconds) {
  seconds = Number(seconds);
  var d = Math.floor(seconds / (3600 * 24));
  var h = Math.floor(seconds % (3600 * 24) / 3600);
  var m = Math.floor(seconds % 3600 / 60);
  var s = Math.floor(seconds % 60);
  var dDisplay = d > 0 ? d + (d == 1 ? " day, ": " days, "): "";
  var hDisplay = h > 0 ? h + (h == 1 ? " hour, ": " hours, "): "";
  var mDisplay = m > 0 ? m + (m == 1 ? " minute, ": " minutes, "): "";
  var sDisplay = s > 0 ? s + (s == 1 ? " second": " seconds"): "";
  return dDisplay + hDisplay + mDisplay + sDisplay;
};

exports.getBuffer = async (url, options) => {
  try {
    options ? options: {}
    const res = await axios( {
      method: "get",
      url,
      headers: {
        'DNT': 1,
        'Upgrade-Insecure-Request': 1
      },
      ...options,
      responseType: 'arraybuffer'
    })
    return res.data
  } catch (err) {
    return err
  }
}

exports.fetchBuffer = async (url, options) => {
  try {
    options ? options: {}
    const res = await axios( {
      method: "GET",
      url,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36",
        'DNT': 1,
        'Upgrade-Insecure-Request': 1
      },
      ...options,
      responseType: 'arraybuffer'
    })
    return res.data
  } catch (err) {
    return err
  }
}

exports.smsg = (tiky, m, store) => {
  try {
    if (!m) return m;
    let M = proto.WebMessageInfo;
    if (m.key) {
      m.id = m.key.id;
      m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
      m.chat = m.key.remoteJid;
      m.fromMe = m.key.fromMe;
      m.isGroup = m.chat.endsWith('@g.us');
      m.sender = tiky.decodeJid(m.fromMe && tiky.user.id || m.participant || m.key.participant || m.chat || '');
      if (m.isGroup) m.participant = tiky.decodeJid(m.key.participant) || '';
    }
    if (m.message) {
      m.mtype = getContentType(m.message);
      m.msg = (m.mtype == 'viewOnceMessage' ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)]: m.message[m.mtype]);
      m.body = m.message.conversation || m.msg.caption || m.msg.text || (m.mtype == 'listResponseMessage') && m.msg.singleSelectReply.selectedRowId || (m.mtype == 'buttonsResponseMessage') && m.msg.selectedButtonId || (m.mtype == 'viewOnceMessage') && m.msg.caption || m.text;
      let quoted = m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage: null;
      m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid: [];
      if (m.msg.caption) {
        m.caption = m.msg.caption;
      }
      if (m.quoted) {
        let type = Object.keys(m.quoted)[0];
        m.quoted = m.quoted[type];
        if (['productMessage'].includes(type)) {
          type = Object.keys(m.quoted)[0];
          m.quoted = m.quoted[type];
        }
        if (typeof m.quoted === 'string') m.quoted = {
          text: m.quoted
        };
        m.quoted.mtype = type;
        m.quoted.id = m.msg.contextInfo.stanzaId;
        m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat;
        m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16: false;
        m.quoted.sender = tiky.decodeJid(m.msg.contextInfo.participant);
        m.quoted.fromMe = m.quoted.sender === tiky.decodeJid(tiky.user.id);
        m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || '';
        m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid: [];
        m.getQuotedObj = m.getQuotedMessage = async () => {
          if (!m.quoted.id) return false;
          let q = await store.loadMessage(m.chat, m.quoted.id, tiky);
          return smsg(tiky, q, store);
        };
        let vM = m.quoted.fakeObj = M.fromObject({
          key: {
            remoteJid: m.quoted.chat,
            fromMe: m.quoted.fromMe,
            id: m.quoted.id
          },
          message: quoted,
          ...(m.isGroup ? {
            participant: m.quoted.sender
          }: {})
        });
        m.quoted.delete = () => tiky.sendMessage(m.quoted.chat, {
          delete: vM.key
        });
        m.quoted.copyNForward = (jid, forceForward = false, options = {}) => tiky.copyNForward(jid, vM, forceForward, options);
        m.quoted.download = () => tiky.downloadMediaMessage(m.quoted);
      }
    }
    if (m.msg.url) m.download = () => tiky.downloadMediaMessage(m.msg);
    m.text = m.msg.text || m.msg.caption || m.message.conversation || m.msg.contentText || m.msg.selectedDisplayText || m.msg.title || '';
    m.reply = (text, chatId = m.chat, options = {}) => Buffer.isBuffer(text) ? tiky.sendMedia(chatId, text, 'file', '', m, {
      ...options
    }): tiky.sendText(chatId, text, m, {
      ...options
    });
    m.copy = () => smsg(tiky, M.fromObject(M.toObject(m)));
    m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => tiky.copyNForward(jid, m, forceForward, options);
    tiky.appenTextMessage = async(text, chatUpdate) => {
      let messages = await generateWAMessage(m.chat, {
        text: text, mentions: m.mentionedJid
      }, {
        userJid: tiky.user.id,
        quoted: m.quoted && m.quoted.fakeObj
      });
      messages.key.fromMe = areJidsSameUser(m.sender, tiky.user.id);
      messages.key.id = m.key.id;
      messages.pushName = m.pushName;
      if (m.isGroup) messages.participant = m.sender;
      let msg = {
        ...chatUpdate,
        messages: [proto.WebMessageInfo.fromObject(messages)],
        type: 'append'
      };
      tiky.ev.emit('messages.upsert', msg);
    };

    return m;
  } catch (e) {}
};

exports.fetchJson = async (url, options) => {
  try {
    options ? options: {}
    const res = await axios( {
      method: 'GET',
      url: url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
      },
      ...options
    })
    return res.data
  } catch (err) {
    return err
  }
}

exports.getGroupAdmins = (participants) => {
  let admins = []
  for (let i of participants) {
    i.admin === "superadmin" ? admins.push(i.id): i.admin === "admin" ? admins.push(i.id): ''
  }
  return admins || []
}

exports.readTime = (ms) => {
  const days = Math.floor(ms / (24 * 60 * 60 * 1000))
  const daysms = ms % (24 * 60 * 60 * 1000)
  const hours = Math.floor(daysms / (60 * 60 * 1000))
  const hoursms = ms % (60 * 60 * 1000)
  const minutes = Math.floor(hoursms / (60 * 1000))
  const minutesms = ms % (60 * 1000)
  const sec = Math.floor(minutesms / 1000)
  const format = [days,
    hours,
    minutes,
    sec].map(v => v.toString().padStart(2, 0))
  return {
    days: Number(format[0]),
    hours: Number(format[1]),
    minutes: Number(format[2]),
    seconds: Number(format[3])
  }
}

exports.toRupiah = function(x) {
  x = x.toString()
  var pattern = /(-?\d+)(\d{3})/
  while (pattern.test(x))
    x = x.replace(pattern, "$1.$2")
  return x
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright(`Update ${__filename}`))
  delete require.cache[file]
  require(file)
})