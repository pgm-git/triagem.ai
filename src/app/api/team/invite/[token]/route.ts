// API Route: /api/team/invite/[token]
// Validate an invitation token before registration

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        if (!token || token.length < 30) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Check if token exists and is valid
        const { data: invite, error } = await supabase
            .from('invitations')
            .select(`
                id, 
                email, 
                role, 
                status, 
                organization_id,
                organizations ( name, slug )
            `)
            .eq('token', token)
            .single();

        if (error || !invite) {
            return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
        }

        if (invite.status !== 'pending') {
            return NextResponse.json({ error: `Invitation is already ${invite.status}` }, { status: 400 });
        }

        return NextResponse.json({ invite });
    } catch (err) {
        console.error('API /team/invite/[token] error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
