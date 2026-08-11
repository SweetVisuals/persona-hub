const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function check() {
  await ssh.connect({ host: '5.75.252.100', username: 'root', password: 'qRrgKXPaxWed' });
  const res = await ssh.execCommand('pm2 logs persona-worker --lines 50 --nostream');
  console.log(res.stdout);
  console.log(res.stderr);
  process.exit(0);
}
check();
