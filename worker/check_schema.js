require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'files' });
  if (error) {
      // fallback
      const res = await supabase.from('files').select('*').limit(1);
      console.log(Object.keys(res.data[0] || {}));
  } else {
      console.log(data);
  }
}
main();
