// Dynamic Webhook: /api/webhooks/whatsapp/[instanceId]
// Each WhatsApp instance has its own webhook URL
// UazAPI sends here: POST /api/webhooks/whatsapp/{instanceId}
// Meta sends here: GET (verify) + POST (messages) /api/webhooks/whatsapp/{instanceId}

import { NextRequest, NextResponse } from 'next/server';
import { normalizeUazAPIPayload, normalizeMetaPayload } from '@/lib/whatsapp/normalize';

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

    // TODO: Look up verify_token from DB for this instance
    // const instance = await supabase.from('whatsapp_instances').select().eq('id', instanceId).single();
    // const expectedToken = instance.meta_verify_token || instance.webhook_secret;
    const expectedToken = process.env.WHATSAPP_WEBHOOK_SECRET || '';

    if (mode === 'subscribe' && token === expectedToken) {
        console.log(`[Webhook] Meta verification OK for instance ${instanceId}`);
        return new Response(challenge, { status: 200 });
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

        // TODO: Look up instance from DB
        // const instance = await supabase.from('whatsapp_instances').select().eq('id', instanceId).single();
        // if (!instance) return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
        // const provider = instance.provider;

        // Detect provider from payload structure
        const isMetaPayload = body.object === 'whatsapp_business_account' || body.entry;
        const provider = isMetaPayload ? 'meta_cloud' : 'uazapi';

        // Normalize the payload to our internal format
        const normalized = provider === 'meta_cloud'
            ? normalizeMetaPayload(body)
            : normalizeUazAPIPayload(body);

        if (!normalized) {
            // Not a message we care about (e.g., status update, group message)
            return NextResponse.json({ received: true, processed: false }, { status: 200 });
        }

        console.log(`[Webhook][${instanceId}][${provider}] Message from ${normalized.from}: ${normalized.text}`);

        // TODO: Route through engine
        // 1. Find or create contact
        // 2. Find or create conversation linked to this instance
        // 3. Save the message
        // 4. Apply routing rules via routing engine
        // 5. Send auto-response via the provider
        // 6. Create routing log

        // For now, just acknowledge receipt
        return NextResponse.json({
            received: true,
            processed: true,
            from: normalized.from,
            provider,
            instanceId,
        }, { status: 200 });

    } catch (error) {
        console.error(`[Webhook][${instanceId}] Error:`, error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
