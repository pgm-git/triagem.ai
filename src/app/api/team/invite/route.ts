// API Route: /api/team/invite
// Manage Team Invitations

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, role = 'agent' } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, role')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id || profile.role !== 'admin' && profile.role !== 'owner') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Check if user is already invited
        const { data: existingInvite, error: existingErr } = await supabase
            .from('invitations')
            .select('id, token, status')
            .eq('organization_id', profile.organization_id)
            .eq('email', email)
            .maybeSingle();

        if (existingInvite) {
            if (existingInvite.status === 'pending') {
                return NextResponse.json({ invite: existingInvite });
            }
            // If accepted or expired, we might want to allow re-invite. For now, just create a new one.
        }

        const { data: invite, error } = await supabase
            .from('invitations')
            .insert({
                organization_id: profile.organization_id,
                email,
                role,
                created_by: user.id
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error details:', error);
            return NextResponse.json({
                error: 'Erro ao criar convite no banco de dados',
                details: error.message,
                code: error.code
            }, { status: 400 });
        }

        return NextResponse.json({ invite });
    } catch (err: any) {
        console.error('API /team/invite error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error', details: err }, { status: 500 });
    }
}

// Optional GET to list pending invites
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) return NextResponse.json({ error: 'No org' }, { status: 404 });

        const { data: invites, error } = await supabase
            .from('invitations')
            .select('id, email, token, status, created_at, role')
            .eq('organization_id', profile.organization_id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ invites });
    } catch (err: any) {
        console.error('API /team/invite GET error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
