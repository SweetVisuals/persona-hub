const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://api.socials.relaysolutions.net',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function updatePassword() {
  const { data: usersData, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error('Error listing users:', userError);
    return;
  }
  
  const user = usersData.users.find(u => u.email === 'pntmgmt@gmail.com');
  if (!user) {
    console.error('User not found');
    return;
  }

  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    password: 'Longlonglong1!'
  });

  if (error) {
    console.error('Update Error:', error);
  } else {
    console.log('Successfully updated password!');
  }
}

updatePassword();
