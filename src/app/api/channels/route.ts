// API Route: /api/channels
// Server-side only — manages WhatsApp instances with Supabase persistence

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UazAPIProvider } from '@/lib/whatsapp/uazapi-provider';

// ── GET: List instances ────────────────────────────────
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) {
        return NextResponse.json({ instances: [] });
    }

    const { data: instances, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ instances: instances || [] });
}

// ── POST: Create new instance ──────────────────────────
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) {
        return NextResponse.json({ error: 'No organization' }, { status: 400 });
    }

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

            // Step 2: Save to Supabase first to get the ID
            const webhookSecret = crypto.randomUUID();
            const { data: dbInstance, error: insertError } = await supabase
                .from('whatsapp_instances')
                .insert({
                    organization_id: profile.organization_id,
                    instance_name: instanceName,
                    provider: 'uazapi',
                    uazapi_token: instanceToken,
                    uazapi_url: baseUrl,
                    status: 'qr_pending',
                    webhook_secret: webhookSecret,
                })
                .select()
                .single();

            if (insertError) {
                return NextResponse.json({ error: insertError.message }, { status: 500 });
            }

            // Step 3: Configure webhook for this instance
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seu-dominio.com';
            const webhookUrl = `${appUrl}/api/webhooks/whatsapp/${dbInstance.id}`;

            const uazProvider = new UazAPIProvider({
                baseUrl,
                instanceToken,
            });

            const webhookResult = await uazProvider.configureWebhook(webhookUrl);
            if (!webhookResult.success) {
                console.warn(`[Channels] Webhook config warning: ${webhookResult.error}`);
            }

            // Step 4: Call connect() to generate QR Code
            console.log(`[Channels] Calling connect() to generate QR Code...`);
            const connectResult = await uazProvider.connect();
            console.log(`[Channels] Connect result:`, JSON.stringify(connectResult).substring(0, 200));

            return NextResponse.json({
                instance: {
                    ...dbInstance,
                    webhook_url: webhookUrl,
                    qrCode: connectResult.qrCode || null,
                    pairingCode: connectResult.pairingCode || null,
                },
            }, { status: 201 });
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

            const verifyToken = crypto.randomUUID();
            const webhookSecret = crypto.randomUUID();

            const { data: dbInstance, error: insertError } = await supabase
                .from('whatsapp_instances')
                .insert({
                    organization_id: profile.organization_id,
                    instance_name: instance_name || validateData.verified_name || 'WhatsApp Business',
                    provider: 'meta_cloud',
                    meta_access_token: access_token,
                    meta_phone_number_id: phone_number_id,
                    meta_business_account_id: business_account_id || null,
                    meta_verify_token: verifyToken,
                    phone_number: validateData.display_phone_number,
                    status: 'connected',
                    webhook_secret: webhookSecret,
                })
                .select()
                .single();

            if (insertError) {
                return NextResponse.json({ error: insertError.message }, { status: 500 });
            }

            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seu-dominio.com';

            return NextResponse.json({
                instance: {
                    ...dbInstance,
                    verified_name: validateData.verified_name,
                    webhook_url: `${appUrl}/api/webhooks/whatsapp/${dbInstance.id}`,
                },
            }, { status: 201 });
        }

        return NextResponse.json({ error: 'Provider not implemented' }, { status: 400 });
    } catch (error) {
        console.error('[Channels] Error creating instance:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// ── DELETE: Remove instance ────────────────────────────
export async function DELETE(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { error } = await supabase.from('whatsapp_instances').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
