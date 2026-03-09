// API Route: /api/conversations/[id]/messages
// Get messages for a specific conversation

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: messages, error } = await supabase
        .from('messages')
        .select('id, content, sender_type, sender_id, status, created_at')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })
        .limit(200);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Mark conversation as read
    await supabase
        .from('conversations')
        .update({ unread_count: 0 })
        .eq('id', id);

    return NextResponse.json(messages || []);
}
