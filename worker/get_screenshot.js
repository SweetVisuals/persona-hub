const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const ssh = new NodeSSH();

async function getScreenshot() {
  try {
    await ssh.connect({
      host: '5.75.252.100',
      username: 'root',
      password: 'mjaXRVMmbMwC7xCbcLCE123',
      port: 22
    });
    console.log('Connected. Downloading...');
    await ssh.getFile('pinterest_debug.png', '/root/persona-hub-worker/pinterest_debug.png');
    console.log('Downloaded to pinterest_debug.png');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
getScreenshot();
