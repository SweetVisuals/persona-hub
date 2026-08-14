const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
(async () => {
  try {
    await ssh.connect({ host: '5.75.252.100', username: 'root', password: 'PniPqbCEW4Lk' });
    const r = await ssh.execCommand('docker logs persona-hub-rest-1 --tail 50');
    console.log(r.stdout);
    console.log(r.stderr);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
