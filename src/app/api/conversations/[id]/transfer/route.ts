import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();
    const { new_sector_id, new_sector_name } = body;

    if (!new_sector_id) {
        return NextResponse.json({ error: 'Missing new_sector_id' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Try to get the user's name or email to log
    const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single();
    const agentName = profile?.full_name || profile?.email || 'Agente';

    // 1. Update the conversation
    const { error: updateError } = await supabase
        .from('conversations')
        .update({
            sector_id: new_sector_id,
            routed_by: 'manual',
            status: 'active'
        })
        .eq('id', id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    // 2. Insert system message into timeline
    await supabase
        .from('messages')
        .insert({
            conversation_id: id,
            content: `Conversa transferida para ${new_sector_name || 'novo setor'} por ${agentName}.`,
            sender_type: 'system',
            status: 'delivered'
        });

    return NextResponse.json({ success: true });
}
