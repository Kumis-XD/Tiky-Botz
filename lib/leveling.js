const fs = require('fs');
const path = require('path');

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

const ranks = [{
  level: 1,
  name: 'Novice'
},
  {
    level: 11,
    name: 'Apprentice'
  },
  {
    level: 21,
    name: 'Adept'
  },
  {
    level: 31,
    name: 'Warrior'
  },
  {
    level: 51,
    name: 'Elite'
  },
  {
    level: 71,
    name: 'Guardian'
  },
  {
    level: 101,
    name: 'Vanguard'
  },
  {
    level: 151,
    name: 'Sentinel'
  },
  {
    level: 201,
    name: 'Champion'
  },
  {
    level: 251,
    name: 'Master'
  },
  {
    level: 301,
    name: 'Warlord'
  },
  {
    level: 351,
    name: 'Heroic'
  },
  {
    level: 401,
    name: 'Legendary'
  },
  {
    level: 451,
    name: 'Mythic'
  },
  {
    level: 500,
    name: 'Max Level - Eternal'
  }];

function getRank(level) {
  let rank = 'Novice';
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
  if (usersData[senders].verified == false) {
    return true
  } else {
    usersData[senders].xp += xpAmount;
  }

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