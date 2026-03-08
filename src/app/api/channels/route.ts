// API Route: /api/channels
// Server-side only — manages WhatsApp instances
// Admin token is used HERE to create UazAPI instances, never exposed to frontend

import { NextRequest, NextResponse } from 'next/server';
import { UazAPIProvider } from '@/lib/whatsapp/uazapi-provider';

// ── GET: List instances ────────────────────────────────
export async function GET() {
    // TODO: Replace with Supabase query
    // const { data } = await supabase.from('whatsapp_instances').select().eq('organization_id', orgId);
    return NextResponse.json({ instances: [] });
}

// ── POST: Create new instance ──────────────────────────
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { provider, instance_name } = body;

        if (!provider || !['uazapi', 'meta_cloud'].includes(provider)) {
            return NextResponse.json(
                { error: 'Provider inválido. Use "uazapi" ou "meta_cloud".' },
                { status: 400 }
            );
        }

        // ═══════════════════════════════════════════════════
        //  UazAPI: Create instance using ADMIN TOKEN (server-only)
        // ═══════════════════════════════════════════════════
        if (provider === 'uazapi') {
            const adminToken = process.env.UAZAPI_ADMIN_TOKEN;
            const baseUrl = process.env.UAZAPI_BASE_URL;

            if (!adminToken || !baseUrl) {
                return NextResponse.json(
                    { error: 'UazAPI não configurada. Verifique UAZAPI_ADMIN_TOKEN e UAZAPI_BASE_URL.' },
                    { status: 500 }
                );
            }

            // Step 1: Create instance via admin token
            const instanceName = instance_name || `trackerai-${Date.now()}`;
            const initResult = await UazAPIProvider.createInstance(
                { baseUrl, adminToken },
                instanceName
            );

            if (!initResult.token) {
                return NextResponse.json(
                    { error: initResult.error || 'Falha ao criar instância na UazAPI.' },
                    { status: 502 }
                );
            }

            const instanceToken = initResult.token;

            // Step 2: Configure webhook for this instance
            const instanceId = crypto.randomUUID();
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seu-dominio.com';
            const webhookUrl = `${appUrl}/api/webhooks/whatsapp/${instanceId}`;

            const uazProvider = new UazAPIProvider({
                baseUrl,
                instanceToken,
            });

            const webhookResult = await uazProvider.configureWebhook(webhookUrl);
            if (!webhookResult.success) {
                console.warn(`[Channels] Webhook config warning: ${webhookResult.error}`);
            }

            // Step 3: Call connect() to generate QR Code
            console.log(`[Channels] Calling connect() to generate QR Code...`);
            const connectResult = await uazProvider.connect();
            console.log(`[Channels] Connect result:`, JSON.stringify(connectResult).substring(0, 200));

            // Step 4: Save to database
            // TODO: Replace with real Supabase insert
            // await supabase.from('whatsapp_instances').insert({
            //   id: instanceId,
            //   organization_id: orgId,
            //   instance_name: instanceName,
            //   provider: 'uazapi',
            //   uazapi_token: instanceToken,
            //   uazapi_url: baseUrl,
            //   status: 'qr_pending',
            //   webhook_secret: crypto.randomUUID(),
            // });

            const newInstance = {
                id: instanceId,
                instance_name: instanceName,
                provider: 'uazapi' as const,
                uazapi_url: baseUrl,
                status: (connectResult.qrCode ? 'qr_pending' : 'disconnected') as 'qr_pending' | 'disconnected',
                webhook_url: webhookUrl,
                created_at: new Date().toISOString(),
                qrCode: connectResult.qrCode || null,
                pairingCode: connectResult.pairingCode || null,
            };

            return NextResponse.json({ instance: newInstance }, { status: 201 });
        }

        // ═══════════════════════════════════════════════════
        //  Meta Cloud API: Validate and store credentials
        // ═══════════════════════════════════════════════════
        if (provider === 'meta_cloud') {
            const { access_token, phone_number_id, business_account_id } = body;

            if (!access_token || !phone_number_id) {
                return NextResponse.json(
                    { error: 'Access Token e Phone Number ID são obrigatórios.' },
                    { status: 400 }
                );
            }

            // Validate token by fetching phone number info
            const validateRes = await fetch(
                `https://graph.facebook.com/v21.0/${phone_number_id}?fields=verified_name,display_phone_number`,
                { headers: { Authorization: `Bearer ${access_token}` } }
            );
            const validateData = await validateRes.json();

            if (!validateRes.ok || validateData.error) {
                return NextResponse.json(
                    { error: validateData.error?.message || 'Token inválido ou Phone Number ID incorreto.' },
                    { status: 400 }
                );
            }

            const instanceId = crypto.randomUUID();
            const verifyToken = crypto.randomUUID(); // For webhook verification

            // TODO: Save to Supabase
            // await supabase.from('whatsapp_instances').insert({
            //   id: instanceId,
            //   organization_id: orgId,
            //   provider: 'meta_cloud',
            //   meta_access_token: access_token,
            //   meta_phone_number_id: phone_number_id,
            //   meta_business_account_id: business_account_id,
            //   meta_verify_token: verifyToken,
            //   phone_number: validateData.display_phone_number,
            //   status: 'connected',
            // });

            const newInstance = {
                id: instanceId,
                instance_name: instance_name || validateData.verified_name || 'WhatsApp Business',
                provider: 'meta_cloud' as const,
                phone_number: validateData.display_phone_number,
                verified_name: validateData.verified_name,
                status: 'connected' as const,
                verify_token: verifyToken,
                webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://seu-dominio.com'}/api/webhooks/whatsapp/${instanceId}`,
                created_at: new Date().toISOString(),
            };

            return NextResponse.json({ instance: newInstance }, { status: 201 });
        }

        return NextResponse.json({ error: 'Provider not implemented' }, { status: 400 });
    } catch (error) {
        console.error('[Channels] Error creating instance:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
