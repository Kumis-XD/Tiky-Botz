const fs = require('fs')
const chalk = require("chalk");
global.author = 'ᴘᴀᴅɪʟᴅᴇᴠ'
global.packname = 'Di Buat Oleh'
global.owner = ['6285867760406']
global.body = '8#x^l5sI&7*W0!y:BzV,QS/k-O.E'
global.botname = 'ᴛɪᴋʏ ʙᴏᴛᴢ'
global.filename = 'ᴛɪᴋʏ - ᴘᴏᴡᴇʀᴇᴅ ʙʏ 『 ᴘᴀᴅɪʟᴅᴇᴠ 』'
global.title = '〔 𝙏 𝙔 𝙆 𝙄  𝘽 𝙊 𝙏 𝙕 〕'
global.idsaluran = '-'
global.namesaluran = '-'
global.sourceurl = 'https://wa.me/6285867760406'
global.footer = 'ᴘᴀᴅɪʟᴅᴇᴠ'
global.prefix = '.'
global.padz = "`"
global.durasi = 60000
global.baseurl = "https://raw.githubusercontent.com/BochilTeam/database/master/games/"
global.limit = {
  user: 10,
  premium: 100,
  point: 5
}

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});