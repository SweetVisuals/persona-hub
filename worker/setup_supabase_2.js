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

    await runCommand('echo "COMPOSE_PROJECT_NAME=persona-hub" >> /root/supabase-persona-hub/.env');
    await runCommand('echo "COMPOSE_PROJECT_NAME=relay-studio" >> /root/supabase-relay-studio/.env');

    await runCommand('cd /root/supabase-persona-hub && docker compose down && docker compose up -d');
    await runCommand('cd /root/supabase-relay-studio && docker compose down && docker compose up -d');

    console.log('Setup finished!');
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err);
    process.exit(1);
  }
}
main();
