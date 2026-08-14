const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const ssh = new NodeSSH();

(async () => {
  try {
    await ssh.connect({ host: '5.75.252.100', username: 'root', password: 'PniPqbCEW4Lk', port: 22 });
    console.log('Connected! Uploading index.js...');
    
    await ssh.putFile('index.js', '/root/persona-hub-worker/index.js');
    console.log('Uploaded index.js');
    
    console.log('Restarting worker...');
    const result = await ssh.execCommand('pm2 restart persona-worker');
    console.log(result.stdout);
    
    ssh.dispose();
  } catch(e) {
    console.log('Error:', e);
  }
})();
