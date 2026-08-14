const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const path = require('path');

async function main() {
  try {
    await ssh.connect({ host: '5.75.252.100', username: 'root', password: 'PniPqbCEW4Lk' });
    console.log('Uploading frontend dist...');
    await ssh.putDirectory(path.join(__dirname, '..', 'dist'), '/var/www/persona-hub', {
      recursive: true,
      concurrency: 10
    });
    console.log('Frontend uploaded successfully.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
main();
