const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const fs = require('fs');

async function main() {
  try {
    await ssh.connect({ host: '5.75.252.100', username: 'root', password: 'qHaNVfPfWL7U' });
    const res = await ssh.execCommand('cat /etc/nginx/sites-available/default');
    let config = res.stdout;
    
    // Replace the block with the SSL version
    config = config.replace(
      /server\s*\{\s*server_name\s*api\.socials\.relaysolutions\.net;[\s\S]*?\}/g,
      `server {
    server_name api.socials.relaysolutions.net;

    location / {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/api.socials.relaysolutions.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.socials.relaysolutions.net/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = api.socials.relaysolutions.net) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name api.socials.relaysolutions.net;
    return 404;
}`
    );
    
    fs.writeFileSync('temp_nginx', config);
    await ssh.putFile('temp_nginx', '/etc/nginx/sites-available/default');
    
    const restartRes = await ssh.execCommand('systemctl restart nginx');
    console.log('Nginx restarted.', restartRes.stderr);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
main();
