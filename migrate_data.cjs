const { createClient } = require('@supabase/supabase-js');

// Old Supabase
const oldUrl = process.env.VITE_SUPABASE_URL || 'https://rfvzrnbayzxibczlntcc.supabase.co';
const oldAnon = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdnpybmJheXp4aWJjemxudGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzQzMDgsImV4cCI6MjA5ODc1MDMwOH0.8L_He5sRHfhaTtgQ8o8HPq5adZL1SN1H_Aso-HLCVu0';
const oldDb = createClient(oldUrl, oldAnon);

// New Hetzner Supabase
const newUrl = 'http://5.75.252.100:8080';
// We use the SERVICE_ROLE_KEY to bypass RLS for inserting and potentially setting auth IDs if needed
const newServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';
const newDb = createClient(newUrl, newServiceKey);

const tables = [
    'businesses',
    'personas',
    'social_accounts',
    'scraping_sources',
    'strategies',
    'files',
    'automation_tasks',
    'logs'
];

async function migrate() {
    console.log('Starting data migration...');
    for (const table of tables) {
        console.log(`Migrating table: ${table}...`);
        
        let allRows = [];
        let from = 0;
        let to = 999;
        let hasMore = true;
        
        while (hasMore) {
            const { data, error } = await oldDb.from(table).select('*').range(from, to);
            if (error) {
                console.error(`Error reading ${table}:`, error);
                return;
            }
            if (data && data.length > 0) {
                allRows = allRows.concat(data);
                from += 1000;
                to += 1000;
            } else {
                hasMore = false;
            }
        }
        
        console.log(`Found ${allRows.length} rows in ${table}.`);
        if (allRows.length > 0) {
            // Need to insert them in chunks to avoid payload too large
            const chunkSize = 100;
            for (let i = 0; i < allRows.length; i += chunkSize) {
                const chunk = allRows.slice(i, i + chunkSize);
                const { error } = await newDb.from(table).upsert(chunk);
                if (error) {
                    console.error(`Error inserting into ${table}:`, error);
                }
            }
            console.log(`Migrated ${allRows.length} rows to ${table}.`);
        }
    }
    console.log('Migration completed!');
}

migrate();
