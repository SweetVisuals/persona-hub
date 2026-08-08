const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function fix() {
  await ssh.connect({ host: '5.75.252.100', username: 'root', password: 'qRrgKXPaxWed' });
  
  const cmd = `
    systemctl stop caddy || true
    systemctl disable caddy || true
    apt-get remove -y caddy || true
    
    cat << 'EOF' > /etc/nginx/sites-available/socials
server {
    server_name socials.relaysolutions.net;
    root /var/www/persona-hub;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
    
    ln -sf /etc/nginx/sites-available/socials /etc/nginx/sites-enabled/
    systemctl reload nginx
    
    # Run certbot to get SSL and auto-configure HTTPS
    certbot --nginx -d socials.relaysolutions.net --non-interactive --agree-tos --register-unsafely-without-email || true
  `;
  
  const res = await ssh.execCommand(cmd);
  console.log(res.stdout);
  console.log(res.stderr);
  process.exit(0);
}
fix();
