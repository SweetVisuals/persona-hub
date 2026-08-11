const { NodeSSH } = require('node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployWorker() {
  try {
    await ssh.connect({ host: '5.75.252.100', username: 'root', password: 'qRrgKXPaxWed' });
    console.log("Connected.");
    await ssh.putFile(path.join(__dirname, 'src', 'authWorker.js'), '/root/persona-hub-worker/src/authWorker.js');
    console.log("Uploaded authWorker.js");
    const res = await ssh.execCommand('pm2 restart persona-worker');
    console.log(res.stdout);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
deployWorker();
