// API Route: /api/channels
// CRUD for WhatsApp instances

import { NextRequest, NextResponse } from 'next/server';

// Demo instances for frontend development
const demoInstances = [
    {
        id: 'inst-1',
        organization_id: 'org-1',
        instance_name: 'Atendimento Principal',
        provider: 'uazapi' as const,
        uazapi_url: 'https://demo.uazapi.com',
        phone_number: '+55 11 99999-0001',
        status: 'connected' as const,
        webhook_secret: 'ws-123',
        last_connected_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

export async function GET() {
    // TODO: Replace with Supabase query
    return NextResponse.json({ instances: demoInstances });
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { provider, instance_name } = body;

    if (!provider || !['uazapi', 'meta_cloud'].includes(provider)) {
        return NextResponse.json(
            { error: 'Provider inválido. Use "uazapi" ou "meta_cloud".' },
            { status: 400 }
        );
    }

    if (provider === 'uazapi') {
        const { uazapi_url, admin_token } = body;
        if (!uazapi_url || !admin_token) {
            return NextResponse.json(
                { error: 'URL base e Admin Token são obrigatórios para UazAPI.' },
                { status: 400 }
            );
        }

        // TODO: Call UazAPIProvider.createInstance() 
        // TODO: Save to Supabase
        const newInstance = {
            id: crypto.randomUUID(),
            organization_id: 'org-1',
            instance_name: instance_name || 'Nova Instância',
            provider: 'uazapi',
            uazapi_url,
            status: 'disconnected',
            webhook_secret: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        return NextResponse.json({ instance: newInstance }, { status: 201 });
    }

    if (provider === 'meta_cloud') {
        const { access_token, phone_number_id, business_account_id } = body;
        if (!access_token || !phone_number_id) {
            return NextResponse.json(
                { error: 'Access Token e Phone Number ID são obrigatórios.' },
                { status: 400 }
            );
        }

        // TODO: Validate token with MetaCloudProvider.connect()
        // TODO: Save to Supabase
        const newInstance = {
            id: crypto.randomUUID(),
            organization_id: 'org-1',
            instance_name: instance_name || 'WhatsApp Business',
            provider: 'meta_cloud',
            meta_phone_number_id: phone_number_id,
            meta_business_account_id: business_account_id,
            status: 'connecting',
            webhook_secret: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        return NextResponse.json({ instance: newInstance }, { status: 201 });
    }
}
