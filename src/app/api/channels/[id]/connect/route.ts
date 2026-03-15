// API Route: /api/channels/[id]/connect
// Initiates connection for a WhatsApp instance
// UazAPI: generates QR Code | Meta: validates token

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UazAPIProvider } from '@/lib/whatsapp/uazapi-provider';
import { MetaCloudProvider } from '@/lib/whatsapp/meta-provider';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json().catch(() => ({}));
        const force = body.force === true;

        const { data: instance, error: fetchError } = await supabase
            .from('whatsapp_instances')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !instance) {
            return NextResponse.json({ error: 'Instância não encontrada' }, { status: 404 });
        }

        // ── UazAPI: Generate QR Code ──────────────────────
        if (instance.provider === 'uazapi') {
            if (!instance.uazapi_token || !instance.uazapi_url) {
                return NextResponse.json(
                    { error: 'Instância UazAPI não configurada corretamente.' },
                    { status: 400 }
                );
            }

            const provider = new UazAPIProvider({
                baseUrl: instance.uazapi_url,
                instanceToken: instance.uazapi_token,
            });

            if (force) {
                console.log(`[Channel Connect] Forcing logout for ${id} before reconnecting`);
                await provider.logout().catch(err => console.error('[Channel Connect] Force logout failed:', err));
            }

            const result = await provider.connect();

            if (!result.success) {
                return NextResponse.json(
                    { error: result.error || 'Falha ao gerar QR Code.' },
                    { status: 502 }
                );
            }

            // Update status in DB
            await supabase.from('whatsapp_instances').update({ status: 'qr_pending' }).eq('id', id);

            return NextResponse.json({
                success: true,
                provider: 'uazapi',
                qrCode: result.qrCode,
                pairingCode: result.pairingCode,
                message: 'Escaneie o QR Code com seu WhatsApp',
            });
        }

        // ── Meta Cloud: Validate Token ───────────────────
        if (instance.provider === 'meta_cloud') {
            const provider = new MetaCloudProvider({
                accessToken: instance.meta_access_token,
                phoneNumberId: instance.meta_phone_number_id,
            });

            const result = await provider.connect();

            if (!result.success) {
                return NextResponse.json(
                    { error: result.error || 'Token inválido.' },
                    { status: 400 }
                );
            }

            // Update status in DB
            await supabase.from('whatsapp_instances').update({ status: 'connected' }).eq('id', id);

            return NextResponse.json({
                success: true,
                provider: 'meta_cloud',
                message: 'Token validado com sucesso',
            });
        }

        return NextResponse.json({ error: 'Provider desconhecido' }, { status: 400 });
    } catch (error: any) {
        console.error(`[Channel Connect] Error for ${id}:`, error);
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
}
