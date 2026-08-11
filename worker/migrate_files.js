const { createClient } = require('@supabase/supabase-js');

// Old Supabase
const oldUrl = 'https://rfvzrnbayzxibczlntcc.supabase.co';
const oldAnon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdnpybmJheXp4aWJjemxudGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzQzMDgsImV4cCI6MjA5ODc1MDMwOH0.8L_He5sRHfhaTtgQ8o8HPq5adZL1SN1H_Aso-HLCVu0';
const oldDb = createClient(oldUrl, oldAnon);

// New Hetzner Supabase
const newUrl = 'https://api.socials.relaysolutions.net';
const newServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';
const newDb = createClient(newUrl, newServiceKey);

async function migrateFiles() {
  console.log('Fetching files from old db...');
  
  // Need to handle pagination to get all files
  let allFiles = [];
  let from = 0;
  const limit = 1000;
  
  while (true) {
    const { data, error } = await oldDb.from('files').select('*').range(from, from + limit - 1);
    if (error) {
      console.error('Error fetching files:', error);
      break;
    }
    if (!data || data.length === 0) break;
    
    allFiles = allFiles.concat(data);
    if (data.length < limit) break;
    from += limit;
  }
  
  console.log(`Found ${allFiles.length} files in old DB.`);
  
  if (allFiles.length > 0) {
    // Some files might be missing persona_id if the personas weren't migrated properly, but we migrated them.
    // Insert in batches of 500
    for (let i = 0; i < allFiles.length; i += 500) {
      const batch = allFiles.slice(i, i + 500);
      const { error: insErr } = await newDb.from('files').upsert(batch, { onConflict: 'id' });
      if (insErr) {
        console.error('Error inserting files batch:', insErr);
      } else {
        console.log(`Inserted batch ${i} to ${i + batch.length}`);
      }
    }
  }
  console.log('File metadata migration done.');
  
  process.exit(0);
}

migrateFiles();
