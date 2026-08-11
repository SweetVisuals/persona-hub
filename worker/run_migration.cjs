const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

(async () => {
  await ssh.connect({ host: '5.75.252.100', username: 'root', password: 'PniPqbCEW4Lk', port: 22 });
  console.log('Connected to Hetzner!');
  
  const sqlCmd = "docker exec -i persona-hub-db-1 psql -U postgres -d postgres -c \"ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS youtube_channel_url TEXT; ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS audio_strategy TEXT DEFAULT 'latest';\"";
  
  const result = await ssh.execCommand(sqlCmd);
  console.log('stdout:', result.stdout);
  if (result.stderr) console.error('stderr:', result.stderr);
  
  // Verify
  const verify = await ssh.execCommand('docker exec -i persona-hub-db-1 psql -U postgres -d postgres -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'personas\' AND column_name IN (\'youtube_channel_url\', \'audio_strategy\');"');
  console.log('Verification:', verify.stdout);
  
  ssh.dispose();
  process.exit(0);
})();
