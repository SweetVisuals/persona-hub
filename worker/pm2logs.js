const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
(async () => {
  try {
    await ssh.connect({ host: '5.75.252.100', username: 'root', password: 'PniPqbCEW4Lk' });
    const r = await ssh.execCommand('pm2 logs persona-worker --nostream --lines 150', { cwd: '/root/worker' });
    console.log(r.stdout);
    console.loh(r.stderr);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
