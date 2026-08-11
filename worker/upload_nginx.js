const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const fs = require('fs');

async function main() {
  try {
    await ssh.connect({ host: '5.75.252.100', username: 'root', password: 'qHaNVfPfWL7U' });
    console.log('Uploading supabase nginx config...');
    await ssh.putFile('nginx_supabase', '/etc/nginx/sites-available/supabase');
    const res = await ssh.execCommand('systemctl restart nginx');
    console.log('Nginx restarted.', res.stderr);
    ssh.dispose();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
main();
