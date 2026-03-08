// API Route: /api/channels/[id]/status
// Returns current connection status for a WhatsApp instance

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // TODO: Fetch instance from Supabase
        // const instance = await supabase.from('whatsapp_instances').select().eq('id', id).single();

        // TODO: Check live status from provider
        // if (instance.provider === 'uazapi') {
        //   const provider = new UazAPIProvider({ baseUrl: instance.uazapi_url, instanceToken: instance.uazapi_token });
        //   const status = await provider.getStatus();
        //   return NextResponse.json(status);
        // }

        // Simulated response for development
        return NextResponse.json({
            state: 'connected',
            phoneNumber: '+55 11 99999-0001',
            provider: 'uazapi',
            lastChecked: new Date().toISOString(),
        });
    } catch (error) {
        console.error(`[Channel Status] Error for ${id}:`, error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
