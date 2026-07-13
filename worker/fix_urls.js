require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.from('files').select('*').like('url', '%pub-xxxxxx%');
  if (error) {
    console.error(error);
    return;
  }
  
  for (const file of data) {
    const newUrl = file.url.replace('pub-xxxxxx', 'pub-8b3d5278883c43098b418402b4ad9ec8');
    await supabase.from('files').update({ url: newUrl }).eq('id', file.id);
    console.log(`Updated file ${file.id} URL`);
  }
  console.log('Done!');
}
main();
