const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function checkLogs() {
  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error(error);
  } else {
    console.log(data);
  }
  
  const { data: accounts } = await supabase.from('social_accounts').select('*').order('created_at', { ascending: false }).limit(5);
  console.log("RECENT ACCOUNTS:", accounts);
}

checkLogs();
