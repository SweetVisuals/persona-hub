const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
(async () => {
  await ssh.connect({ host: '5.75.252.100', username: 'root', password: 'PniPqbCEW4Lk' });
  const sql = `
    INSERT INTO public.proxies (url) VALUES ('http://kxirhnwo:q40ohnvgdox8@31.59.20.176:6754');
  `;
  const result = await ssh.execCommand(`docker exec persona-hub-db-1 psql -U postgres -d postgres -c "${sql}"`);
  console.log(result.stdout);
  console.error(result.stderr);
  process.exit(0);
})();
