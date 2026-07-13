require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.from('files').select('*').order('created_at', { ascending: false }).limit(5);
  if (error) console.error(error);
  else console.log(data);
}
main();
