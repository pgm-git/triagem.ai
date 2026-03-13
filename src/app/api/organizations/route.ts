import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        const { data: organization, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', profile.organization_id)
            .single();

        if (error) throw error;

        return NextResponse.json({ organization });
    } catch (error: any) {
        console.error('Organization GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();

        // Allowed fields for update
        const { name, logo_url, primary_color, secondary_color, sidebar_color, config_json } = body;

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, role')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        // RBAC: Only admin or owner can update
        if (profile.role !== 'admin' && profile.role !== 'owner') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (logo_url !== undefined) updateData.logo_url = logo_url;
        if (primary_color !== undefined) updateData.primary_color = primary_color;
        if (secondary_color !== undefined) updateData.secondary_color = secondary_color;
        if (sidebar_color !== undefined) updateData.sidebar_color = sidebar_color;
        if (config_json !== undefined) updateData.config_json = config_json;
        updateData.updated_at = new Date().toISOString();

        const { data: organization, error } = await supabase
            .from('organizations')
            .update(updateData)
            .eq('id', profile.organization_id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ organization });
    } catch (error: any) {
        console.error('Organization PATCH Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
