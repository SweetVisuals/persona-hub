const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
(async () => {
  try {
    await ssh.connect({ host: '5.75.252.100', username: 'root', password: 'PniPqbCEW4Lk' });
    const r = await ssh.execCommand('systemctl status nginx');
    console.log(r.stdout);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
