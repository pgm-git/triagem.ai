const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  const { data: users } = await supabase.auth.admin.listUsers();
  if(!users || !users.users) return console.log('No users found');
  
  for (const u of users.users) {
    const fullName = u.user_metadata?.full_name || u.email.split('@')[0];
    const { error: pError } = await supabase.from('profiles').insert({
      id: u.id,
      full_name: fullName,
      email: u.email
    });
    console.log(`Profile ${u.email}:`, pError ? pError.message : 'OK');
  }
}
fix();
