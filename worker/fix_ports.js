const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function main() {
  try {
    await ssh.connect({ host: '5.75.252.100', username: 'root', password: 'xuLfidHVumt9' });
    console.log('Connected.');
    
    let res = await ssh.execCommand('sed -i "s/^SUPAVISOR_PORT=.*/SUPAVISOR_PORT=6544/g" /root/supabase-relay-studio/.env');
    console.log(res.stdout, res.stderr);
    
    res = await ssh.execCommand('sed -i "s/^INBUCKET_PORT=.*/INBUCKET_PORT=8025/g" /root/supabase-relay-studio/.env');
    console.log(res.stdout, res.stderr);
    
    res = await ssh.execCommand('cd /root/supabase-relay-studio && docker compose up -d');
    console.log(res.stdout, res.stderr);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
main();
