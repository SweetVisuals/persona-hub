const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkMem() {
  try {
    await ssh.connect({
      host: '5.75.252.100',
      username: 'root',
      password: 'mjaXRVMmbMwC7xCbcLCE123',
      port: 22
    });
    const result = await ssh.execCommand('free -m && dmesg -T | grep -i oom');
    console.log(result.stdout);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
checkMem();
