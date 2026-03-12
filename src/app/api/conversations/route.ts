// API Route: /api/conversations
// List conversations for the authenticated user's organization

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) {
        return NextResponse.json([]);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'active', 'resolved', 'pending_triage'
    const sectorId = searchParams.get('sector_id');

    let query = supabase
        .from('conversations')
        .select(`
            id,
            contact_phone,
            contact_name,
            status,
            routed_by,
            matched_keyword,
            unread_count,
            last_message_at,
            created_at,
            queued_at,
            in_progress_at,
            resolved_at,
            agent_id,
            sector_id,
            collected_data,
            sectors ( id, name, icon )
        `)
        .eq('organization_id', profile.organization_id)
        .order('last_message_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (sectorId) query = query.eq('sector_id', sectorId);

    const { data, error } = await query.limit(50);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
}
