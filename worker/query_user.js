const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
ssh.connect({ host: '5.75.252.100', username: 'root', password: 'qHaNVfPfWL7U' })
  .then(async () => {
    let res = await ssh.execCommand('docker exec persona-hub-db-1 psql -U postgres -d postgres -c "SELECT user_id FROM public.businesses LIMIT 1;"');
    console.log(res.stdout);
    ssh.dispose();
    process.exit(0);
  }).catch(console.error);
