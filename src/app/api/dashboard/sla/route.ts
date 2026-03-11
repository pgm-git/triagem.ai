// API Route: /api/dashboard/sla
// Calculates SLA metrics for the Call Center queue

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, role')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'No org' }, { status: 404 });
        }

        const orgId = profile.organization_id;
        const isAgent = profile.role === 'agent';

        // For an Agent, we only care about their sectors
        let agentSectors: string[] = [];
        if (isAgent) {
            const { data: sectors } = await supabase
                .from('agent_sectors')
                .select('sector_id')
                .eq('profile_id', user.id);
            agentSectors = (sectors || []).map(s => s.sector_id);
        }

        // Q1: Number of conversations waiting in the queue
        let queueQuery = supabase.from('conversations')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('status', 'waiting_agent');

        if (isAgent && agentSectors.length > 0) {
            queueQuery = queueQuery.in('sector_id', agentSectors);
        } else if (isAgent && agentSectors.length === 0) {
            // Agent has no sectors, so nothing waiting for them
            queueQuery = queueQuery.eq('sector_id', '00000000-0000-0000-0000-000000000000'); // Dummy
        }

        const [queueRes] = await Promise.all([queueQuery]);

        // Q2: Resolved by the agent today (or total if admin)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        let resolvedQuery = supabase.from('conversations')
            .select('id, queued_at, in_progress_at, resolved_at', { count: 'exact' })
            .eq('organization_id', orgId)
            .eq('status', 'resolved')
            .gte('resolved_at', todayStart.toISOString());

        if (isAgent) {
            resolvedQuery = resolvedQuery.eq('agent_id', user.id);
        }

        const resolvedRes = await resolvedQuery;

        // Calculate Averages
        let totalWaitTime = 0; // seconds
        let totalHandleTime = 0; // seconds
        let validWaitCount = 0;
        let validHandleCount = 0;

        for (const conv of (resolvedRes.data || [])) {
            if (conv.queued_at && conv.in_progress_at) {
                const wait = (new Date(conv.in_progress_at).getTime() - new Date(conv.queued_at).getTime()) / 1000;
                totalWaitTime += wait;
                validWaitCount++;
            }
            if (conv.in_progress_at && conv.resolved_at) {
                const handle = (new Date(conv.resolved_at).getTime() - new Date(conv.in_progress_at).getTime()) / 1000;
                totalHandleTime += handle;
                validHandleCount++;
            }
        }

        const avgWaitTimeSecs = validWaitCount > 0 ? Math.round(totalWaitTime / validWaitCount) : 0;
        const avgHandleTimeSecs = validHandleCount > 0 ? Math.round(totalHandleTime / validHandleCount) : 0;

        // Current assigned in progress
        let myInProgressCount = 0;
        if (isAgent) {
            const { count } = await supabase.from('conversations')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', orgId)
                .eq('status', 'in_progress')
                .eq('agent_id', user.id);
            myInProgressCount = count || 0;
        }

        return NextResponse.json({
            queue_length: queueRes.count || 0,
            resolved_today: resolvedRes.count || 0,
            avg_wait_time_secs: avgWaitTimeSecs,
            avg_handle_time_secs: avgHandleTimeSecs,
            in_progress: myInProgressCount
        });

    } catch (err) {
        console.error('API /dashboard/sla error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
