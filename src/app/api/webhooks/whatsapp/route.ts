import { NextResponse } from 'next/server';

/**
 * WhatsApp Webhook Receiver
 * Handles incoming messages from WhatsApp providers (Twilio, 360dialog, Meta Cloud API)
 */

// GET: Webhook verification (Meta requires this for setup)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_SECRET;

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// POST: Incoming messages
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate webhook secret
        const webhookSecret = request.headers.get('x-webhook-secret');
        if (webhookSecret !== process.env.WHATSAPP_WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Extract message from payload (provider-agnostic structure)
        const { from, message, timestamp } = body;

        if (!from || !message) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // TODO: Route the message through the routing engine
        // 1. Find or create conversation
        // 2. Save the message
        // 3. Apply routing rules
        // 4. Send auto-response if matched
        // 5. Create routing log

        console.log(`[Webhook] Message from ${from}: ${message}`);

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
        console.error('[Webhook] Error processing message:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
