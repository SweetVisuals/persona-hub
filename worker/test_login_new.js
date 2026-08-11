const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://api.socials.relaysolutions.net',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE'
);
async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'pntmgmt@gmail.com',
    password: 'Longlonglong1!'
  });
  console.log(data);
  console.log(error);
  process.exit(0);
}
test();
