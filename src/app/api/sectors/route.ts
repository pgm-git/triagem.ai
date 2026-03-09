import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/sectors — List sectors for authenticated user's org
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) {
        return NextResponse.json({ error: 'No organization' }, { status: 400 });
    }

    const { data: sectors, error } = await supabase
        .from('sectors')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('priority', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(sectors);
}

// POST /api/sectors — Create a new sector
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) {
        return NextResponse.json({ error: 'No organization' }, { status: 400 });
    }

    const body = await request.json();

    const { data: sector, error } = await supabase
        .from('sectors')
        .insert({
            organization_id: profile.organization_id,
            name: body.name,
            icon: body.icon || '📂',
            destination: body.destination || '',
            keywords: body.keywords || [],
            response_template: body.response_template || '',
            is_active: body.is_active ?? true,
            is_fallback: body.is_fallback ?? false,
            fallback_message: body.fallback_message || null,
            priority: body.priority ?? 0,
            collection_fields: body.collection_fields || [],
            schedule_start: body.schedule_start || null,
            schedule_end: body.schedule_end || null,
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(sector, { status: 201 });
}

// PUT /api/sectors — Update a sector (expects { id, ...fields })
export async function PUT(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { data: sector, error } = await supabase
        .from('sectors')
        .update({
            name: body.name,
            icon: body.icon,
            destination: body.destination,
            keywords: body.keywords,
            response_template: body.response_template,
            is_active: body.is_active,
            is_fallback: body.is_fallback,
            fallback_message: body.fallback_message,
            priority: body.priority,
            collection_fields: body.collection_fields,
            schedule_start: body.schedule_start,
            schedule_end: body.schedule_end,
        })
        .eq('id', body.id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(sector);
}

// DELETE /api/sectors?id=xxx — Delete a sector
export async function DELETE(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { error } = await supabase.from('sectors').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
