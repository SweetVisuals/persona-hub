const { scrapePinterestSearch } = require('./src/sourcing');

async function test() {
  const urls = await scrapePinterestSearch('black & white city aesthetic', null, 5);
  console.log('Result:', urls);
}
test();
