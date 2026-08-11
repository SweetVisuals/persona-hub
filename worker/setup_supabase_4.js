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

    await runCommand('docker stop $(docker ps -a -q) && docker rm $(docker ps -a -q)');

    // Set up ports correctly
    // Persona Hub uses 8000 (Kong/Studio) and 5432 (Postgres)
    await runCommand('sed -i "s/^STUDIO_PORT=.*/STUDIO_PORT=8000/g" /root/supabase-persona-hub/.env');
    await runCommand('sed -i "s/^POSTGRES_PORT=.*/POSTGRES_PORT=5432/g" /root/supabase-persona-hub/.env');
    await runCommand('sed -i "s/^KONG_HTTP_PORT=.*/KONG_HTTP_PORT=8080/g" /root/supabase-persona-hub/.env');
    await runCommand('sed -i "s/^KONG_HTTPS_PORT=.*/KONG_HTTPS_PORT=8443/g" /root/supabase-persona-hub/.env');
    
    // Relay Studio uses 8001 (Kong/Studio) and 5433 (Postgres)
    await runCommand('sed -i "s/^STUDIO_PORT=.*/STUDIO_PORT=8001/g" /root/supabase-relay-studio/.env');
    await runCommand('sed -i "s/^POSTGRES_PORT=.*/POSTGRES_PORT=5433/g" /root/supabase-relay-studio/.env');
    await runCommand('sed -i "s/^KONG_HTTP_PORT=.*/KONG_HTTP_PORT=8081/g" /root/supabase-relay-studio/.env');
    await runCommand('sed -i "s/^KONG_HTTPS_PORT=.*/KONG_HTTPS_PORT=8444/g" /root/supabase-relay-studio/.env');

    await runCommand('cd /root/supabase-persona-hub && docker compose up -d');
    await runCommand('cd /root/supabase-relay-studio && docker compose up -d');

    // Wait 30 seconds for databases to boot fully
    await new Promise(r => setTimeout(r, 30000));

    await runCommand('docker exec -i persona-hub-db-1 psql -U postgres -d postgres < /root/full_schema.sql');
    await runCommand('docker exec -i persona-hub-db-1 psql -U postgres -d postgres < /root/verified_lyrics_schema.sql');

    console.log('Setup finished!');
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err);
    process.exit(1);
  }
}
main();
