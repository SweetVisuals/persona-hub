const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function run() {
  await ssh.connect({
    host: '5.75.252.100',
    username: 'root',
    password: 'mjaXRVMmbMwC7xCbcLCE123',
    port: 22
  });
  const res = await ssh.execCommand('pm2 logs persona-worker --lines 50 --nostream');
  console.log(res.stdout);
  console.error(res.stderr);
  process.exit(0);
}
run();
