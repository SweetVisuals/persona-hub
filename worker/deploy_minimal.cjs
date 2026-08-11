const { NodeSSH } = require('node-ssh');
const path = require('path');
const { execSync } = require('child_process');

const ssh = new NodeSSH();

async function deploy() {
  try {
    console.log('Connecting to Hetzner...');
    await ssh.connect({
      host: '5.75.252.100',
      username: 'root',
      password: 'PniPqbCEW4Lk',
      port: 22
    });
    console.log('Connected! Uploading worker files...');

    const remoteWorkerDir = '/root/persona-hub-worker';
    const remoteFrontendDir = '/var/www/persona-hub';

    await ssh.execCommand(`mkdir -p ${remoteWorkerDir}`);
    await ssh.execCommand(`mkdir -p ${remoteFrontendDir}`);

    console.log('Building frontend locally...');
    execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    
    console.log('Uploading frontend dist...');
    await ssh.putDirectory(path.join(__dirname, '..', 'dist'), remoteFrontendDir, {
      recursive: true,
      concurrency: 10
    });

    const localDir = path.join(__dirname, '..', 'worker');
    const filesToUpload = [
      'index.js', 'package.json', '.env',
      'src/videoProcessor.js', 'src/poster.js',
      'src/scraper.js', 'src/storage.js',
      'src/sourcing.js', 'src/imageScraper.js',
      'src/editor.js', 'src/transcriber.js', 'src/authWorker.js',
      'src/audioWorker.js', 'src/channelResolver.js'
    ];

    for (const file of filesToUpload) {
      console.log(`Uploading ${file}...`);
      const fileDir = path.dirname(file);
      if (fileDir !== '.') {
        await ssh.execCommand(`mkdir -p ${remoteWorkerDir}/${fileDir}`);
      }
      await ssh.putFile(path.join(localDir, file), `${remoteWorkerDir}/${file}`);
    }

    console.log('Installing dependencies on remote worker...');
    const installCmd = await ssh.execCommand('cd /root/persona-hub-worker && npm install && npx playwright install chromium');
    console.log(installCmd.stdout);
    if (installCmd.stderr) console.error(installCmd.stderr);

    console.log('Restarting worker via PM2...');
    const pm2Start = await ssh.execCommand('cd /root/persona-hub-worker && pm2 restart persona-worker || pm2 start index.js --name persona-worker');
    console.log(pm2Start.stdout);
    if (pm2Start.stderr) console.error(pm2Start.stderr);

    console.log('Deployment successful!');
    process.exit(0);
  } catch (err) {
    console.error('Deployment failed:', err);
    process.exit(1);
  }
}
deploy();
