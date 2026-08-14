const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
(async () => {
  try {
    await ssh.connect({ host: '5.75.252.100', username: 'root', password: 'PniPqbCEW4Lk' });
    await ssh.execCommand('systemctl stop apport.service');
    await ssh.execCommand('systemctl disable apport.service');
    await ssh.execCommand('rm -rf /var/lib/apport/coredump/*');
    console.log('Apport disabled and coredumps cleared!');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
