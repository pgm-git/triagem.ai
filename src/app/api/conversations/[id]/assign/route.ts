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

        // 1. Assign the conversation to the logged-in user
        // and update its status from 'waiting_agent' to 'in_progress'
        const { data: conv, error } = await supabase
            .from('conversations')
            .update({
                agent_id: user.id,
                status: 'in_progress',
                in_progress_at: new Date().toISOString()
            })
            .eq('id', conversationId)
            .select()
            .single();

        if (error || !conv) {
            console.error('Failed to assign conversation:', error);
            return NextResponse.json({ error: 'Failed to assign conversation' }, { status: 500 });
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
                content: `Atendimento iniciado por ${agentName}.`
            });

        return NextResponse.json({ success: true, conversation: conv });

    } catch (error) {
        console.error('API /assign error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
