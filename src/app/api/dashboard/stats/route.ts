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

    // Parallel queries for performance
    const [
        activeConvs,
        pendingConvs,
        resolvedToday,
        totalSectors,
        activeInstances,
        recentConvs,
        sectorDist,
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
    ]);

    // Calculate sector distribution
    const sectorCounts: Record<string, { name: string; icon: string; count: number }> = {};
    for (const conv of (sectorDist.data || [])) {
        const sector = conv.sectors as { name: string; icon: string } | null;
        const key = conv.sector_id || 'none';
        if (!sectorCounts[key]) {
            sectorCounts[key] = { name: sector?.name || 'Sem setor', icon: sector?.icon || '📋', count: 0 };
        }
        sectorCounts[key].count++;
    }

    return NextResponse.json({
        active_conversations: activeConvs.count || 0,
        pending_triage: pendingConvs.count || 0,
        resolved_today: resolvedToday.count || 0,
        total_sectors: totalSectors.count || 0,
        active_instances: activeInstances.count || 0,
        recent_conversations: recentConvs.data || [],
        sector_distribution: Object.values(sectorCounts).sort((a, b) => b.count - a.count),
    });
}
