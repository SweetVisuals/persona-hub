const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
(async () => {
  try {
    await ssh.connect({ host: '5.75.252.100', username: 'root', password: 'PniPqbCEW4Lk' });
    const script = `#!/bin/bash
find /var/lib/apport/coredump -type f -mtime +1 -delete
docker system prune -af
pm2 flush
`;
    await ssh.execCommand(`echo "${script.replace(/\n/g, '\\n')}" > /root/cleanup.sh`);
    await ssh.execCommand('chmod +x /root/cleanup.sh');
    await ssh.execCommand('(crontab -l 2>/dev/null | grep -v cleanup; echo "0 3 * * * /root/cleanup.sh") | crontab -');
    console.log('Cleanup script installed and scheduled!');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
