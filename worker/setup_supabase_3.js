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

    // Stop and remove existing containers
    await runCommand('docker stop $(docker ps -a -q) && docker rm $(docker ps -a -q)');

    // Remove container_name from docker-compose.yml in both directories
    await runCommand('sed -i "/container_name:/d" /root/supabase-persona-hub/docker-compose.yml');
    await runCommand('sed -i "/container_name:/d" /root/supabase-relay-studio/docker-compose.yml');

    await runCommand('cd /root/supabase-persona-hub && docker compose up -d');
    await runCommand('cd /root/supabase-relay-studio && docker compose up -d');

    // Also run the schemas!
    await ssh.putFile('../full_schema.sql', '/root/full_schema.sql');
    await ssh.putFile('../verified_lyrics_schema.sql', '/root/verified_lyrics_schema.sql');
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
