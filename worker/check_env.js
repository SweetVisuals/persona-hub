const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
ssh.connect({ host: '5.75.252.100', username: 'root', password: 'qHaNVfPfWL7U' })
  .then(async () => {
    let res = await ssh.execCommand('cat /root/supabase-persona-hub/.env | grep -E "URL|CORS"');
    console.log(res.stdout);
    ssh.dispose();
    process.exit(0);
  }).catch(console.error);
