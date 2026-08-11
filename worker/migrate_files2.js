const { createClient } = require('@supabase/supabase-js');

const oldUrl = 'https://rfvzrnbayzxibczlntcc.supabase.co';
const oldAnon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdnpybmJheXp4aWJjemxudGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzQzMDgsImV4cCI6MjA5ODc1MDMwOH0.8L_He5sRHfhaTtgQ8o8HPq5adZL1SN1H_Aso-HLCVu0';
const oldDb = createClient(oldUrl, oldAnon);

const newUrl = 'https://api.socials.relaysolutions.net';
const newServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';
const newDb = createClient(newUrl, newServiceKey);

async function migrateFiles() {
  console.log('Fetching files from old db...');
  
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
    const { data: personas } = await newDb.from('personas').select('id');
    const validPersonaIds = new Set(personas.map(p => p.id));
    
    const validFiles = allFiles.filter(f => !f.persona_id || validPersonaIds.has(f.persona_id));
    console.log(`Filtered down to ${validFiles.length} valid files that match existing personas.`);
    
    // Batch size of 50 to prevent DNS / network issues
    for (let i = 0; i < validFiles.length; i += 50) {
      const batch = validFiles.slice(i, i + 50);
      const { error: insErr } = await newDb.from('files').upsert(batch, { onConflict: 'id' });
      if (insErr) {
        console.error('Error inserting files batch:', insErr);
        process.exit(1);
      } else {
        console.log(`Inserted batch ${i} to ${i + batch.length}`);
      }
      // tiny wait to yield event loop and prevent connection flooding
      await new Promise(r => setTimeout(r, 100));
    }
  }
  console.log('File metadata migration done.');
  
  process.exit(0);
}

migrateFiles();
