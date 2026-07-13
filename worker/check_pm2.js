const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkPm2() {
  try {
    await ssh.connect({
      host: '5.75.252.100',
      username: 'root',
      password: 'mjaXRVMmbMwC7xCbcLCE123',
      port: 22
    });
    console.log('Connected. Fetching pm2 logs...');
    const result = await ssh.execCommand('pm2 logs persona-worker --lines 50 --nostream');
    console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
checkPm2();
