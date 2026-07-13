require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.from('social_accounts').select('session_cookie').eq('platform', 'pinterest');
  if (data) {
     console.log(data[0].session_cookie.substring(0, 200) + '...');
  }
}
main();
