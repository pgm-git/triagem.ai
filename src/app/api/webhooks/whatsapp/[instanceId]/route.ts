// Dynamic Webhook: /api/webhooks/whatsapp/[instanceId]
// Full pipeline: receive → parse → contact → conversation → route → respond → save

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role client for webhook (no user session)
function getAdminSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// ── GET: Meta Webhook Verification ─────────────────────
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ instanceId: string }> }
) {
    const { instanceId } = await params;
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe') {
        const supabase = getAdminSupabase();
        const { data: instance } = await supabase
            .from('whatsapp_instances')
            .select('meta_verify_token')
            .eq('id', instanceId)
            .single();

        if (instance && token === instance.meta_verify_token) {
            return new Response(challenge, { status: 200 });
        }
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// ── POST: Incoming Messages ────────────────────────────
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ instanceId: string }> }
) {
    const { instanceId } = await params;

    try {
        const body = await request.json();
        const supabase = getAdminSupabase();

        // Lookup the instance
        const { data: instance } = await supabase
            .from('whatsapp_instances')
            .select('id, organization_id, provider, uazapi_token, uazapi_url')
            .eq('id', instanceId)
            .single();

        if (!instance) {
            console.warn(`[Webhook] Unknown instance: ${instanceId}`);
            return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
        }

        // ──── Parse message based on provider ────
        let senderPhone: string | null = null;
        let senderName: string | null = null;
        let messageText: string | null = null;
        let externalId: string | null = null;

        if (instance.provider === 'uazapi') {
            const event = body.event || body.type;

            // Handle connection status updates
            if (event === 'connection' || event === 'connection.update') {
                const state = body.data?.state || body.state;
                const newStatus = state === 'open' ? 'connected' : 'disconnected';
                await supabase
                    .from('whatsapp_instances')
                    .update({
                        status: newStatus,
                        ...(newStatus === 'connected' ? { last_connected_at: new Date().toISOString() } : {}),
                    })
                    .eq('id', instanceId);
                console.log(`[Webhook] Instance ${instanceId} status: ${newStatus}`);
                return NextResponse.json({ received: true });
            }

            // Only process incoming text messages
            if (event !== 'messages' && event !== 'messages.upsert') {
                return NextResponse.json({ received: true });
            }

            const data = body.data || body;
            const key = data.key || {};
            const msg = data.message || {};

            // Skip messages sent by us
            if (key.fromMe === true) {
                return NextResponse.json({ received: true });
            }

            senderPhone = (key.remoteJid || '').replace('@s.whatsapp.net', '').replace('@c.us', '');
            senderName = data.pushName || null;
            messageText = msg.conversation || msg.extendedTextMessage?.text || msg.text || null;
            externalId = key.id || null;

        } else if (instance.provider === 'meta_cloud') {
            const change = body.entry?.[0]?.changes?.[0]?.value;
            if (change?.statuses) return NextResponse.json({ received: true });

            const message = change?.messages?.[0];
            if (!message) return NextResponse.json({ received: true });

            senderPhone = message.from;
            senderName = change.contacts?.[0]?.profile?.name || null;
            messageText = message.text?.body || null;
            externalId = message.id || null;
        }

        if (!senderPhone || !messageText) {
            return NextResponse.json({ received: true });
        }

        console.log(`[Webhook] ${senderPhone} (${senderName}): ${messageText.substring(0, 100)}`);

        // ──── 1. Find or create contact ────
        const { data: existingContact } = await supabase
            .from('contacts')
            .select('id, total_messages')
            .eq('organization_id', instance.organization_id)
            .eq('phone', senderPhone)
            .single();

        let contactId: string;

        if (existingContact) {
            contactId = existingContact.id;
            await supabase.from('contacts').update({
                name: senderName || undefined,
                last_message_at: new Date().toISOString(),
                total_messages: (existingContact.total_messages || 0) + 1,
            }).eq('id', contactId);
        } else {
            const { data: newContact } = await supabase
                .from('contacts')
                .insert({
                    organization_id: instance.organization_id,
                    phone: senderPhone,
                    name: senderName,
                    last_message_at: new Date().toISOString(),
                })
                .select('id')
                .single();
            contactId = newContact!.id;
            await supabase.rpc('increment_usage', { p_org_id: instance.organization_id, p_type: 'contact' });
        }

        // ──── 2. Find active conversation or create new ────
        const { data: existingConv } = await supabase
            .from('conversations')
            .select('id, sector_id, unread_count, status')
            .eq('organization_id', instance.organization_id)
            .eq('contact_phone', senderPhone)
            .in('status', ['active', 'pending_triage', 'waiting_agent', 'in_progress'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        let conversationId: string;
        let requiresRouting = !existingConv || existingConv.status === 'pending_triage';
        let responseTemplate: string | null = null;
        let routedBy: 'auto' | 'fallback' = 'fallback';

        if (existingConv && !requiresRouting) {
            // It's already routed (e.g. 'active', 'waiting_agent', 'in_progress'). 
            // The AI/Router doesn't interfere anymore. Just update timestamps.
            conversationId = existingConv.id;
            await supabase.from('conversations').update({
                last_message_at: new Date().toISOString(),
                unread_count: (existingConv.unread_count || 0) + 1,
            }).eq('id', conversationId);
        } else { // This block handles both new conversations and existing pending_triage ones
            // ──── 3. Route the message ────
            const { data: sectors } = await supabase
                .from('sectors')
                .select('*')
                .eq('organization_id', instance.organization_id)
                .eq('is_active', true)
                .order('priority', { ascending: true });

            const normalized = messageText.toLowerCase().trim();
            let matchedSectorId: string | null = null;
            let matchedKeyword: string | null = null;

            for (const sector of (sectors || [])) {
                if (sector.is_fallback) continue;
                for (const kw of (sector.keywords || []) as string[]) {
                    if (normalized.includes(kw.toLowerCase())) {
                        matchedSectorId = sector.id;
                        matchedKeyword = kw;
                        routedBy = 'auto';
                        responseTemplate = sector.response_template;
                        break;
                    }
                }
                if (matchedSectorId) break;
            }

            if (!matchedSectorId) {
                // ──── 3.5 AI Routing Pipeline ────
                const { processMessageWithAI } = await import('@/lib/ai/router');
                const aiResult = await processMessageWithAI(messageText, instance.organization_id, sectors || [], supabase);

                if (aiResult) {
                    console.log(`[Webhook] AI Decision: ${aiResult.action} | Sector: ${aiResult.sector_id} | Reasoning: ${aiResult.reasoning}`);

                    if (aiResult.action === 'route' && aiResult.sector_id) {
                        const validSector = (sectors || []).find(s => s.id === aiResult.sector_id);
                        if (validSector && !validSector.is_fallback) {
                            matchedSectorId = validSector.id;
                            routedBy = 'auto';
                            matchedKeyword = 'AI_INTENT';
                        }
                    }
                    responseTemplate = aiResult.response;
                }

                if (!matchedSectorId) {
                    const fallback = (sectors || []).find(s => s.is_fallback);
                    if (fallback) {
                        matchedSectorId = fallback.id;
                        if (!responseTemplate) {
                            responseTemplate = fallback.fallback_message;
                        }
                    }
                }
            }

            if (existingConv) {
                // Multi-turn triage finally hit a sector
                conversationId = existingConv.id;
                await supabase.from('conversations').update({
                    sector_id: matchedSectorId || existingConv.sector_id,
                    status: matchedSectorId ? 'waiting_agent' : 'pending_triage',
                    queued_at: matchedSectorId ? new Date().toISOString() : null,
                    routed_by: routedBy,
                    matched_keyword: matchedKeyword,
                    last_message_at: new Date().toISOString(),
                    unread_count: (existingConv.unread_count || 0) + 1,
                }).eq('id', conversationId);
            } else {
                // Completely new conversation
                const { data: newConv } = await supabase
                    .from('conversations')
                    .insert({
                        organization_id: instance.organization_id,
                        instance_id: instanceId,
                        sector_id: matchedSectorId,
                        contact_id: contactId,
                        contact_phone: senderPhone,
                        contact_name: senderName,
                        status: matchedSectorId ? 'waiting_agent' : 'pending_triage',
                        queued_at: matchedSectorId ? new Date().toISOString() : null,
                        routed_by: routedBy,
                        matched_keyword: matchedKeyword,
                        last_message_at: new Date().toISOString(),
                        unread_count: 1,
                    })
                    .select('id')
                    .single();

                conversationId = newConv!.id;
                await supabase.rpc('increment_usage', { p_org_id: instance.organization_id, p_type: 'conversation' });
            }

            // Log routing
            if (matchedSectorId) {
                await supabase.from('routing_logs').insert({
                    organization_id: instance.organization_id,
                    conversation_id: conversationId,
                    event_type: routedBy === 'auto' ? 'auto_route' : 'fallback',
                    to_sector_id: matchedSectorId,
                    matched_keyword: matchedKeyword,
                    metadata: { message_preview: messageText.substring(0, 100) },
                });
            }
        }

        // ──── 4. Send auto-response ────
        if (responseTemplate && instance.provider === 'uazapi' && instance.uazapi_token && instance.uazapi_url) {
            try {
                const { UazAPIProvider } = await import('@/lib/whatsapp/uazapi-provider');
                const provider = new UazAPIProvider({
                    baseUrl: instance.uazapi_url,
                    instanceToken: instance.uazapi_token,
                });
                const result = await provider.sendText(senderPhone, responseTemplate);
                if (result.success) {
                    await supabase.from('messages').insert({
                        conversation_id: conversationId,
                        content: responseTemplate,
                        sender_type: 'bot',
                        uazapi_message_id: result.messageId,
                        status: 'sent',
                    });
                    await supabase.rpc('increment_usage', { p_org_id: instance.organization_id, p_type: 'message_sent' });
                    console.log(`[Webhook] Auto-response sent to ${senderPhone}`);
                }
            } catch (err) {
                console.error('[Webhook] Auto-response error:', err);
            }
        }

        // ──── 5. Save incoming message ────
        await supabase.from('messages').insert({
            conversation_id: conversationId,
            content: messageText,
            sender_type: 'client',
            uazapi_message_id: externalId,
            status: 'received',
        });

        await supabase.rpc('increment_usage', { p_org_id: instance.organization_id, p_type: 'message_received' });

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
        console.error(`[Webhook][${instanceId}] Error:`, error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
