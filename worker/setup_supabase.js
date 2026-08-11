const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function runCommand(cmd) {
  console.log(`\n> ${cmd}`);
  const result = await ssh.execCommand(cmd);
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  return result;
}

async function main() {
  try {
    await ssh.connect({ host: '5.75.252.100', username: 'root', password: 'xuLfidHVumt9' });
    console.log('SSH Connected.');

    await runCommand('apt-get update');
    await runCommand('apt-get install -y docker.io docker-compose-plugin git curl');
    
    await runCommand('rm -rf /root/supabase-persona-hub');
    await runCommand('mkdir -p /root/supabase-persona-hub');
    await runCommand('cp -a /root/supabase-persona-hub-src/docker/. /root/supabase-persona-hub/');
    await runCommand('cp /root/supabase-persona-hub/.env.example /root/supabase-persona-hub/.env');
    
    await runCommand('sed -i "s/STUDIO_PORT=3000/STUDIO_PORT=8000/g" /root/supabase-persona-hub/.env');
    await runCommand('sed -i "s/POSTGRES_PORT=5432/POSTGRES_PORT=5432/g" /root/supabase-persona-hub/.env');
    await runCommand('sed -i "s/KONG_HTTP_PORT=8000/KONG_HTTP_PORT=8080/g" /root/supabase-persona-hub/.env');
    await runCommand('sed -i "s/KONG_HTTPS_PORT=8443/KONG_HTTPS_PORT=8443/g" /root/supabase-persona-hub/.env');
    await runCommand('sed -i "s/SITE_URL=http:\\/\\/localhost:3000/SITE_URL=http:\\/\\/5.75.252.100:8080/g" /root/supabase-persona-hub/.env');

    await runCommand('rm -rf /root/supabase-relay-studio');
    await runCommand('mkdir -p /root/supabase-relay-studio');
    await runCommand('cp -a /root/supabase-persona-hub-src/docker/. /root/supabase-relay-studio/');
    await runCommand('cp /root/supabase-relay-studio/.env.example /root/supabase-relay-studio/.env');
    
    await runCommand('sed -i "s/STUDIO_PORT=3000/STUDIO_PORT=8001/g" /root/supabase-relay-studio/.env');
    await runCommand('sed -i "s/POSTGRES_PORT=5432/POSTGRES_PORT=5433/g" /root/supabase-relay-studio/.env');
    await runCommand('sed -i "s/KONG_HTTP_PORT=8000/KONG_HTTP_PORT=8081/g" /root/supabase-relay-studio/.env');
    await runCommand('sed -i "s/KONG_HTTPS_PORT=8443/KONG_HTTPS_PORT=8444/g" /root/supabase-relay-studio/.env');
    await runCommand('sed -i "s/SITE_URL=http:\\/\\/localhost:3000/SITE_URL=http:\\/\\/5.75.252.100:8081/g" /root/supabase-relay-studio/.env');

    await runCommand('cd /root/supabase-persona-hub && docker compose pull && docker compose up -d');
    await runCommand('cd /root/supabase-relay-studio && docker compose pull && docker compose up -d');

    console.log('Setup finished!');
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err);
    process.exit(1);
  }
}
main();
