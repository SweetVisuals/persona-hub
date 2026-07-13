require('dotenv').config();
const { NodeSSH } = require('node-ssh');
const fs = require('fs');

const ssh = new NodeSSH();

async function main() {
  try {
    console.log('Connecting to server...');
    await ssh.connect({
      host: process.env.HETZNER_IP,
      username: 'root',
      privateKey: fs.readFileSync('C:\\Users\\Shadow\\.ssh\\id_rsa', 'utf8')
    });

    console.log('Fetching PM2 logs...');
    const result = await ssh.execCommand('pm2 logs persona-worker --lines 100 --nostream');
    console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
