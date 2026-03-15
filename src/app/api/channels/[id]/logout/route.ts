// API Route: /api/channels/[id]/logout
// Disconnects a WhatsApp instance without deleting it

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
        const { data: instance, error: fetchError } = await supabase
            .from('whatsapp_instances')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !instance) {
            return NextResponse.json({ error: 'Instância não encontrada' }, { status: 404 });
        }

        let success = false;

        if (instance.provider === 'uazapi' && instance.uazapi_token && instance.uazapi_url) {
            const provider = new UazAPIProvider({
                baseUrl: instance.uazapi_url,
                instanceToken: instance.uazapi_token,
            });
            const result = await provider.logout();
            success = result.success;
        } else if (instance.provider === 'meta_cloud') {
            const provider = new MetaCloudProvider({
                accessToken: instance.meta_access_token,
                phoneNumberId: instance.meta_phone_number_id,
            });
            const result = await provider.logout();
            success = result.success;
        }

        // Update status in DB
        await supabase
            .from('whatsapp_instances')
            .update({ status: 'disconnected' })
            .eq('id', id);

        return NextResponse.json({ success });
    } catch (err: any) {
        console.error(`[Channel Logout] Error for ${id}:`, err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
