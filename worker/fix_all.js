const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function main() {
  try {
    await ssh.connect({ host: '5.75.252.100', username: 'root', password: 'xuLfidHVumt9' });
    console.log('Connected to SSH.');

    // 1. Configure Relay Studio (Project 1) - Default ports
    const relayEnv = [
      'KONG_HTTP_PORT=8000',
      'KONG_HTTPS_PORT=8443',
      'STUDIO_PORT=3000',
      'POSTGRES_PORT=5432',
      'SUPAVISOR_PORT=6543',
      'INBUCKET_PORT=8024'
    ];
    for (const env of relayEnv) {
      const [key, val] = env.split('=');
      await ssh.execCommand(`sed -i "s/^${key}=.*/${key}=${val}/g" /root/supabase-relay-studio/.env`);
    }

    // 2. Configure Persona Hub (Project 2) - Offset ports
    const personaEnv = [
      'KONG_HTTP_PORT=8001',
      'KONG_HTTPS_PORT=8444',
      'STUDIO_PORT=3001',
      'POSTGRES_PORT=5433',
      'SUPAVISOR_PORT=6544',
      'INBUCKET_PORT=8025'
    ];
    for (const env of personaEnv) {
      const [key, val] = env.split('=');
      await ssh.execCommand(`sed -i "s/^${key}=.*/${key}=${val}/g" /root/supabase-persona-hub/.env`);
    }

    // 3. Restart both instances
    console.log('Restarting Relay Studio...');
    await ssh.execCommand('cd /root/supabase-relay-studio && docker compose down && docker compose up -d');
    
    console.log('Restarting Persona Hub...');
    await ssh.execCommand('cd /root/supabase-persona-hub && docker compose down && docker compose up -d');

    // 4. Update Nginx Configuration
    console.log('Updating Nginx...');
    
    // Create new Nginx block for Persona Hub API
    const nginxPersonaApi = `
server {
    server_name api.socials.relaysolutions.net;

    location / {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;
    // We will just append the new block to the main config file since it's simple
    // The user mentioned /etc/nginx/sites-available/supabase but earlier we saw it in /etc/nginx/sites-available/default
    // We will append to /etc/nginx/sites-available/default
    await ssh.execCommand(`echo '${nginxPersonaApi}' >> /etc/nginx/sites-available/default`);

    // Restart Nginx
    await ssh.execCommand('systemctl restart nginx');
    
    console.log('Done!');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
