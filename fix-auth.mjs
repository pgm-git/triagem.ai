import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
    try {
        const { data: users, error: uaErr } = await supabase.auth.admin.listUsers();
        if (uaErr) return console.error('Auth Error:', uaErr);
        if (!users || !users.users) return console.log('No users found');

        for (const u of users.users) {
            const fullName = u.user_metadata?.full_name || u.email.split('@')[0];
            const { error: pError } = await supabase.from('profiles').insert({
                id: u.id,
                full_name: fullName,
                email: u.email
            });
            console.log(`Profile ${u.email}:`, pError ? pError.message : 'OK');

            const { data: prof } = await supabase.from('profiles').select('organization_id').eq('id', u.id).single();
            console.log(`Checking org id for ${u.email}:`, prof?.organization_id);

            if (prof && !prof.organization_id) {
                console.log(`Org trigger failed for ${u.email}. Firing manual creation...`);
                // Manually create org
                const slug = fullName.toLowerCase().replace(/ /g, '-') + '-' + u.id.substring(0, 8);
                const { data: org, error: orgErr } = await supabase.from('organizations').insert({
                    name: fullName,
                    slug,
                    email: u.email
                }).select().single();
                if (org) {
                    await supabase.from('profiles').update({ organization_id: org.id }).eq('id', u.id);
                    console.log('Created org:', org.id);
                } else {
                    console.error('Org create error:', orgErr);
                }
            }
        }
    } catch (err) {
        console.error('Catch:', err);
    }
}
fix();
