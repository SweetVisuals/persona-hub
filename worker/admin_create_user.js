const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://api.socials.relaysolutions.net',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function createUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'pntmgmt@gmail.com',
    password: 'password123',
    email_confirm: true
  });
  console.log('Admin Create User Data:', data);
  console.log('Admin Create User Error:', error);

  if (data?.user) {
    // If successful, update the businesses table to match the new user ID
    // Find the old businesses
    const { data: businesses, error: bizErr } = await supabase.from('businesses').select('*');
    console.log('Businesses:', businesses);
    
    // In this case, if there is a business, we just update it
    if (businesses && businesses.length > 0) {
      const oldUserId = businesses[0].user_id;
      const newUserId = data.user.id;
      console.log(`Updating all entities from ${oldUserId} to ${newUserId}`);
      
      const { error: updErr1 } = await supabase.from('businesses').update({ user_id: newUserId }).eq('user_id', oldUserId);
      const { error: updErr2 } = await supabase.from('personas').update({ user_id: newUserId }).eq('user_id', oldUserId);
      console.log('Update Errors:', updErr1, updErr2);
    }
  }
}

createUser();
