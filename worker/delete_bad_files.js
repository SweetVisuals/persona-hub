require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.from('files').select('id, size');
  if (error) {
    console.error(error);
    return;
  }
  
  const badIds = data.filter(f => f.size === '0.00 MB').map(f => f.id);
  
  if (badIds.length > 0) {
    const { error: delError } = await supabase.from('files').delete().in('id', badIds);
    if (delError) console.error(delError);
    else console.log(`Deleted ${badIds.length} bad files with 0.00 MB size.`);
  } else {
    console.log('No bad files found.');
  }
}
main();
