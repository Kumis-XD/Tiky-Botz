const { exec } = require('child_process');
const os = require('os');

function installFfmpeg() {
  const platform = os.platform();

  if (['linux', 'darwin', 'win32'].includes(platform)) {
    console.log('Menggunakan @ffmpeg-installer/ffmpeg untuk platform desktop.');
    exec('npm install @ffmpeg-installer/ffmpeg', (error, stdout, stderr) => {
      if (error) {
        console.error(`Gagal menginstal @ffmpeg-installer/ffmpeg: ${error.message}`);
        return;
      }
      console.log(`Berhasil menginstal @ffmpeg-installer/ffmpeg:\n${stdout}`);
    });
  } else if (platform === 'android') {
    console.log('Menggunakan pkg untuk menginstal ffmpeg di Android.');
    exec('pkg install ffmpeg -y', (error, stdout, stderr) => {
      if (error) {
        console.error(`Gagal menginstal ffmpeg di Android: ${error.message}`);
        return;
      }
      console.log(`Berhasil menginstal ffmpeg di Android:\n${stdout}`);
    });
  } else {
    console.error('Platform tidak dikenali. Tidak dapat menginstal ffmpeg.');
  }
}

// Jalankan fungsi instalasi ffmpeg
installFfmpeg();
