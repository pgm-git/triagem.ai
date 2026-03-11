import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bebkytkbrxrwahukhhpw.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_T-9tUxmyJmNOCCiRv2Ymog_dpQi1yPq';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
    console.log('Creating Admin test user...');
    const { data: adminUser, error: adminErr } = await supabase.auth.admin.createUser({
        email: 'joao.admin@empresa.com',
        password: 'password123',
        email_confirm: true,
        user_metadata: {
            full_name: 'Joao Admin',
            company_name: 'Empresa Test',
            role: 'admin'
        }
    });

    if (adminErr) {
        console.error('Error creating admin:', adminErr.message);
    } else {
        console.log('Admin user created successfully!', adminUser.user.id);
    }
}

main().catch(console.error);
