import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: conversationId } = await params;

        // 1. Resolve the conversation (mark as resolved and record SLA time)
        const { data: conv, error } = await supabase
            .from('conversations')
            .update({
                status: 'resolved',
                resolved_at: new Date().toISOString()
            })
            .eq('id', conversationId)
            // Ensure the user actually has permission to resolve it
            // Simple check: the agent must be the one who assigned it, or an admin.
            // For now, RLS handles org boundaries.
            .select()
            .single();

        if (error || !conv) {
            console.error('Failed to resolve conversation:', error);
            return NextResponse.json({ error: 'Failed to resolve conversation' }, { status: 500 });
        }

        // 2. Insert a system message into the chat history for audit
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

        const agentName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Atendente';

        await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_type: 'system',
                content: `Atendimento encerrado por ${agentName}.`
            });

        return NextResponse.json({ success: true, conversation: conv });

    } catch (error) {
        console.error('API /resolve error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
