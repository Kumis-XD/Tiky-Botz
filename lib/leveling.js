const fs = require('fs');
const path = require('path');
const chalk = require("chalk");

const usersFilePath = path.join(__dirname, '../database/user.json');
let usersData;

// Load data pengguna dari file JSON atau inisialisasi dengan objek kosong jika file belum ada
try {
  usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));
} catch (error) {
  console.error("Error loading user data or file does not exist. Initializing empty data.");
  usersData = {};
}

// Fungsi mendapatkan XP yang dibutuhkan untuk level tertentu
function getXpForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}

// Rank berdasarkan level
const ranks = [{
  level: 1,
  name: 'Beginner'
},
  {
    level: 5,
    name: 'Novice'
  },
  {
    level: 10,
    name: 'Intermediate'
  },
  {
    level: 20,
    name: 'Advanced'
  },
  {
    level: 30,
    name: 'Expert'
  },
  {
    level: 50,
    name: 'Master'
  },
  {
    level: 75,
    name: 'Legend'
  },
  {
    level: 100,
    name: 'Champion'
  }];

// Fungsi untuk mendapatkan rank berdasarkan level
function getRank(level) {
  let rank = 'Beginner'; // Default rank
  for (const r of ranks) {
    if (level >= r.level) {
      rank = r.name;
    } else {
      break;
    }
  }
  return rank;
}

// Fungsi untuk menambah XP dan memperbarui level dan rank
function addXp(reply, senders, xpAmount) {
  // Tambahkan XP ke pengguna
  usersData[senders].xp += xpAmount;

  let xpNeeded = getXpForLevel(usersData[senders].level);

  // Periksa apakah pengguna naik level
  while (usersData[senders].xp >= xpNeeded) {
    usersData[senders].xp -= xpNeeded;
    usersData[senders].level += 1;
    const newRank = getRank(usersData[senders].level);
    reply(`🎉 Selamat! @${senders.split('@')[0]} naik ke level ${usersData[senders].level} (${newRank})!`);

    xpNeeded = getXpForLevel(usersData[senders].level);
  }

  // Simpan perubahan ke file
  fs.writeFileSync(usersFilePath, JSON.stringify(usersData, null, 2));
}

module.exports = {
  addXp,
  getXpForLevel,
  getRank
};

let file = require.resolve(__filename);
fs.watchFile(file,
  () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`Update ${__filename}`));
    delete require.cache[file];
    require(file);
  });