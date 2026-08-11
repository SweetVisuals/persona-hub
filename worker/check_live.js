fetch('https://socials.relaysolutions.net')
  .then(res => res.text())
  .then(html => {
    const match = html.match(/src="\/assets\/(index-[^"]+)"/);
    if (match) {
      console.log('Found JS:', match[1]);
      return fetch('https://socials.relaysolutions.net/assets/' + match[1]);
    }
  })
  .then(res => res.text())
  .then(js => {
    if (js.includes('api.socials.relaysolutions.net')) console.log('LIVE site has NEW url');
    if (js.includes('mepqllcflrsvjltqeqg.supabase.co')) console.log('LIVE site has OLD url');
  })
  .catch(console.error);
