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
      password: 'qRrgKXPaxWed',
      port: 22
    });
    console.log('Connected! Uploading worker files...');

    const remoteWorkerDir = '/root/persona-hub-worker';
    const remoteFrontendDir = '/var/www/persona-hub';

    // Create remote dirs
    await ssh.execCommand(`mkdir -p ${remoteWorkerDir}`);
    await ssh.execCommand(`mkdir -p ${remoteFrontendDir}`);

    console.log('Building frontend locally...');
    try {
      execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    } catch (e) {
      console.error('Frontend build failed');
      process.exit(1);
    }
    
    console.log('Uploading frontend dist...');
    await ssh.putDirectory(path.join(__dirname, '..', 'dist'), remoteFrontendDir, {
      recursive: true,
      concurrency: 10
    });

    // Upload files
    const localDir = __dirname;
    const filesToUpload = [
      'index.js',
      'package.json',
      '.env',
      'src/videoProcessor.js',
      'src/poster.js',
      'src/scraper.js',
      'src/storage.js',
      'src/sourcing.js',
      'src/imageScraper.js',
      'src/editor.js',
      'src/transcriber.js',
      'src/authWorker.js',
      'fonts/TikTokSans-Medium.ttf'
    ];

    for (const file of filesToUpload) {
      console.log(`Uploading ${file}...`);
      const fileDir = path.dirname(file);
      if (fileDir !== '.') {
        await ssh.execCommand(`mkdir -p ${remoteWorkerDir}/${fileDir}`);
      }
      await ssh.putFile(path.join(localDir, file), `${remoteWorkerDir}/${file}`);
    }

    console.log('Installing dependencies on server...');
    const npmInstall = await ssh.execCommand('npm install && npm install pm2 -g', { cwd: remoteWorkerDir });
    console.log(npmInstall.stdout);
    if (npmInstall.stderr) console.error(npmInstall.stderr);

    console.log('Running system dependencies and PM2 setup...');
    const deployCmd = `
          cd ${remoteWorkerDir}
          echo "Waiting for apt-get lock..."
          while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do sleep 1; done
          while fuser /var/lib/apt/lists/lock >/dev/null 2>&1; do sleep 1; done
          
          echo "Installing system dependencies..."
          apt-get update
          apt-get install -y ffmpeg python3-pip curl

          echo "Cleaning up disk space..."
          rm -rf ~/.cache/pip
          apt-get clean
          
          echo "Installing CPU-only PyTorch (Saves ~3GB disk space)..."
          pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu --break-system-packages
          
          echo "Installing Whisper..."
          pip3 install -U openai-whisper --break-system-packages
          
          echo "Installing Playwright browsers on server..."
          npx playwright install --with-deps chromium
          
          echo "Killing zombie headless browsers to free RAM..."
          pkill -f chromium || true
          pkill -f chrome || true
          pkill -f yt-dlp || true

          # Install yt-dlp globally
          echo "Installing yt-dlp..."
          rm -f /usr/local/bin/yt-dlp
          wget -qO /usr/local/bin/yt-dlp https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp
          chmod a+rx /usr/local/bin/yt-dlp
          
          echo "Starting worker via PM2..."
          pm2 delete persona-worker || true
          pm2 start index.js --name persona-worker
          pm2 save
        `;
    const pm2Start = await ssh.execCommand(deployCmd);
    console.log(pm2Start.stdout);
    if (pm2Start.stderr) console.error(pm2Start.stderr);

    console.log('✅ Deployment successful!');
    process.exit(0);

  } catch (err) {
    console.error('Deployment failed:', err);
    process.exit(1);
  }
}

deploy();
