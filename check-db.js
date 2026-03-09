const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: users } = await supabase.auth.admin.listUsers();
  console.log('--- USERS ---');
  console.log(users.users.map(u => ({ id: u.id, email: u.email, meta: u.user_metadata })));
  
  const { data: profiles } = await supabase.from('profiles').select('*');
  console.log('\n--- PROFILES ---');
  console.log(profiles);
  
  const { data: orgs } = await supabase.from('organizations').select('*');
  console.log('\n--- ORGANIZATIONS ---');
  console.log(orgs);
}
check();
