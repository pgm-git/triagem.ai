// API Route: /api/dashboard/stats
// Returns real dashboard statistics from Supabase

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
        return NextResponse.json({
            active_conversations: 0,
            pending_triage: 0,
            resolved_today: 0,
            total_sectors: 0,
            active_instances: 0,
            recent_conversations: [],
            sector_distribution: [],
        });
    }

    const orgId = profile.organization_id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Parallel queries for performance
    const [
        activeConvs,
        pendingConvs,
        resolvedToday,
        totalSectors,
        activeInstances,
        recentConvs,
        sectorDist,
        // Sprint 7: Volume & Efficiency Analytics
        convsToday,
        convsMonth,
        messagesToday,
        messagesMonth,
        totalRouted,
        totalFallback,
        fallbackConvs,
    ] = await Promise.all([
        supabase.from('conversations').select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId).eq('status', 'active'),
        supabase.from('conversations').select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId).eq('status', 'pending_triage'),
        supabase.from('conversations').select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId).eq('status', 'resolved')
            .gte('created_at', todayStart.toISOString()),
        supabase.from('sectors').select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId).eq('is_active', true),
        supabase.from('whatsapp_instances').select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId).eq('status', 'connected'),
        supabase.from('conversations')
            .select('id, contact_name, contact_phone, status, last_message_at, sectors ( name, icon )')
            .eq('organization_id', orgId)
            .order('last_message_at', { ascending: false })
            .limit(5),
        supabase.from('conversations')
            .select('sector_id, sectors ( name, icon )')
            .eq('organization_id', orgId)
            .eq('status', 'active'),

        // Sprint 7 Added Queries
        supabase.from('conversations').select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId).gte('created_at', todayStart.toISOString()),
        supabase.from('conversations').select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId).gte('created_at', monthStart.toISOString()),
        // RLS will scope messages to the user's organization based on conversation link
        supabase.from('messages').select('id', { count: 'exact', head: true })
            .gte('created_at', todayStart.toISOString()),
        supabase.from('messages').select('id', { count: 'exact', head: true })
            .gte('created_at', monthStart.toISOString()),
        supabase.from('conversations').select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId).not('routed_by', 'is', null),
        supabase.from('conversations').select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId).eq('routed_by', 'fallback'),
        supabase.from('conversations')
            .select('id, contact_name, contact_phone, status, last_message_at, sectors ( name, icon )')
            .eq('organization_id', orgId)
            .eq('routed_by', 'fallback')
            .order('last_message_at', { ascending: false })
            .limit(10),
    ]);

    // Calculate sector distribution
    const sectorCounts: Record<string, { name: string; icon: string; count: number }> = {};
    for (const conv of (sectorDist.data || [])) {
        const sector = conv.sectors as unknown as { name: string; icon: string } | null;
        const key = conv.sector_id || 'none';
        if (!sectorCounts[key]) {
            sectorCounts[key] = { name: sector?.name || 'Sem setor', icon: sector?.icon || '📋', count: 0 };
        }
        sectorCounts[key].count++;
    }

    // Calculate Routing Efficiency
    const routed = totalRouted.count || 0;
    const fallbacks = totalFallback.count || 0;
    const efficiency = routed > 0 ? Math.round(((routed - fallbacks) / routed) * 100) : 100;

    return NextResponse.json({
        active_conversations: activeConvs.count || 0,
        pending_triage: pendingConvs.count || 0,
        resolved_today: resolvedToday.count || 0,
        total_sectors: totalSectors.count || 0,
        active_instances: activeInstances.count || 0,
        recent_conversations: recentConvs.data || [],
        sector_distribution: Object.values(sectorCounts).sort((a, b) => b.count - a.count),

        // Sprint 7 Analytics
        volume: {
            conversations_today: convsToday.count || 0,
            conversations_month: convsMonth.count || 0,
            messages_today: messagesToday.count || 0,
            messages_month: messagesMonth.count || 0,
        },
        routing_efficiency: efficiency,
        total_fallback: fallbacks,
        fallback_conversations: fallbackConvs.data || [],
    });
}
