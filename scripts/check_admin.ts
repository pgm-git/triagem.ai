import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
    const { data: users, error: err } = await supabase.auth.admin.listUsers();
    const joao = users?.users.find(u => u.email === 'joao.admin@empresa.com');

    if (!joao) {
        console.log('User not found');
        return;
    }

    console.log('User ID:', joao.id);

    const { data: profile } = await supabase.from('profiles').select().eq('id', joao.id).single();
    console.log('Profile:', profile);

    if (profile && !profile.organization_id) {
        console.log('Creating organization manually...');
        const { data: org } = await supabase.from('organizations').insert({ name: 'Empresa Test' }).select().single();
        if (org) {
            await supabase.from('profiles').update({ organization_id: org.id }).eq('id', joao.id);
            console.log('Fixed profile with org ID:', org.id);
        }
    }
}

main().catch(console.error);
