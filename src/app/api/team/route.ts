// API Route: /api/team
// List organization members and their assigned sectors

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
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

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        // Fetch all members of this organization
        const { data: members, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, role, created_at')
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Fetch all agent_sectors allocations for these members
        const memberIds = members.map(m => m.id);
        const { data: allocations, error: allocError } = await supabase
            .from('agent_sectors')
            .select('profile_id, sector_id')
            .in('profile_id', memberIds);

        if (allocError) throw allocError;

        // Combine
        const enrichedMembers = members.map(m => ({
            ...m,
            sectors: (allocations || []).filter(a => a.profile_id === m.id).map(a => a.sector_id)
        }));

        return NextResponse.json({ members: enrichedMembers });
    } catch (err: any) {
        console.error('API /team error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error', details: err }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { profile_id, sector_ids } = body;

        if (!profile_id || !Array.isArray(sector_ids)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // We could verify if the user is admin of the org here.
        // For simplicity, we assume RLS on agent_sectors is active.

        // 1. Delete all existing allocations for this profile
        const { error: deleteError } = await supabase
            .from('agent_sectors')
            .delete()
            .eq('profile_id', profile_id);

        if (deleteError) throw deleteError;

        // 2. Insert new allocations
        if (sector_ids.length > 0) {
            const inserts = sector_ids.map(sid => ({
                profile_id,
                sector_id: sid
            }));

            const { error: insertError } = await supabase
                .from('agent_sectors')
                .insert(inserts);

            if (insertError) throw insertError;
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('API /team update error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error', details: err }, { status: 500 });
    }
}
export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { profile_id, role } = body;

        if (!profile_id || !role) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Get requester profile
        const { data: requester } = await supabase
            .from('profiles')
            .select('organization_id, role')
            .eq('id', user.id)
            .single();

        if (!requester?.organization_id || (requester.role !== 'admin' && requester.role !== 'owner')) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // Get target profile to ensure same org
        const { data: target } = await supabase
            .from('profiles')
            .select('organization_id, role')
            .eq('id', profile_id)
            .single();

        if (!target || target.organization_id !== requester.organization_id) {
            return NextResponse.json({ error: 'User not found in your organization' }, { status: 404 });
        }

        // Security check: Only owners can change other owners or promote to owner (if we add that)
        // For now, let's keep it simple but safe: admins can't touch owners.
        if (target.role === 'owner' && requester.role !== 'owner') {
            return NextResponse.json({ error: 'Admins cannot modify owner roles' }, { status: 403 });
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', profile_id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('API /team PATCH error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
