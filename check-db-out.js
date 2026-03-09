const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const { data: profiles } = await supabase.from('profiles').select('*');
  const { data: orgs } = await supabase.from('organizations').select('*');
  
  fs.writeFileSync('db-state.json', JSON.stringify({users: users.users, profiles, orgs}, null, 2));
}
check();
