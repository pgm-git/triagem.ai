// API Route: /api/messages/send
// Sends a message via WhatsApp and saves to Supabase

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UazAPIProvider } from '@/lib/whatsapp/uazapi-provider';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { conversation_id, content } = body;

    if (!conversation_id || !content) {
        return NextResponse.json({ error: 'Missing conversation_id or content' }, { status: 400 });
    }

    // Get conversation details
    const { data: conversation } = await supabase
        .from('conversations')
        .select('id, contact_phone, instance_id, organization_id')
        .eq('id', conversation_id)
        .single();

    if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Get instance for sending
    const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('provider, uazapi_token, uazapi_url, meta_access_token, meta_phone_number_id')
        .eq('id', conversation.instance_id)
        .single();

    if (!instance) {
        return NextResponse.json({ error: 'WhatsApp instance not found' }, { status: 404 });
    }

    // Save the message first as 'sending'
    const { data: message, error: insertError } = await supabase
        .from('messages')
        .insert({
            conversation_id,
            content,
            sender_type: 'agent',
            sender_id: user.id,
            status: 'sending',
        })
        .select('id')
        .single();

    if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Send via provider
    let sendSuccess = false;
    let externalId: string | undefined;

    if (instance.provider === 'uazapi' && instance.uazapi_token && instance.uazapi_url) {
        const provider = new UazAPIProvider({
            baseUrl: instance.uazapi_url,
            instanceToken: instance.uazapi_token,
        });
        const result = await provider.sendText(conversation.contact_phone, content);
        sendSuccess = result.success;
        externalId = result.messageId;
    } else if (instance.provider === 'meta_cloud' && instance.meta_access_token && instance.meta_phone_number_id) {
        // Meta Cloud API send
        const res = await fetch(
            `https://graph.facebook.com/v21.0/${instance.meta_phone_number_id}/messages`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${instance.meta_access_token}`,
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: conversation.contact_phone,
                    text: { body: content },
                }),
            }
        );
        const data = await res.json();
        sendSuccess = res.ok;
        externalId = data.messages?.[0]?.id;
    }

    // Update message status
    await supabase
        .from('messages')
        .update({
            status: sendSuccess ? 'sent' : 'failed',
            uazapi_message_id: externalId || null,
        })
        .eq('id', message!.id);

    // Update conversation last_message_at
    await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString(), unread_count: 0 })
        .eq('id', conversation_id);

    // Increment usage
    if (sendSuccess) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (profile?.organization_id) {
            // Use service role for RPC
            const { createClient: createAdminClient } = await import('@supabase/supabase-js');
            const adminSupabase = createAdminClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
            await adminSupabase.rpc('increment_usage', {
                p_org_id: profile.organization_id,
                p_type: 'message_sent',
            });
        }
    }

    return NextResponse.json({
        success: sendSuccess,
        message_id: message!.id,
        external_id: externalId,
    });
}
