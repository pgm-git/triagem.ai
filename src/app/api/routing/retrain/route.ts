import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SectorTrigger } from '@/types';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 400 });
        }

        const orgId = profile.organization_id;
        const body = await req.json();
        const { conversation_id, sector_id, keyword, type } = body;

        if (!conversation_id || !sector_id || !keyword || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const cleanKeyword = keyword.trim().toLowerCase();

        // 1. Fetch the sector to update its triggers
        const { data: sector, error: sectorError } = await supabase
            .from('sectors')
            .select('triggers')
            .eq('id', sector_id)
            .eq('organization_id', orgId)
            .single();

        if (sectorError || !sector) {
            return NextResponse.json({ error: 'Sector not found' }, { status: 404 });
        }

        // 2. Append the new keyword to the correct trigger type
        let currentTriggers: SectorTrigger[] = Array.isArray(sector.triggers) ? sector.triggers as SectorTrigger[] : [];
        let triggerFound = false;

        const updatedTriggers = currentTriggers.map(t => {
            if (t.type === type) {
                triggerFound = true;
                if (!t.keywords.includes(cleanKeyword)) {
                    return { ...t, keywords: [...t.keywords, cleanKeyword] };
                }
            }
            return t;
        });

        if (!triggerFound) {
            updatedTriggers.push({
                type: type,
                keywords: [cleanKeyword],
                is_active: true,
                response_template: 'Olá! Entendi o seu pedido, já vamos te atender.'
            });
        }

        // 3. Update the sector
        const { error: updateSectorError } = await supabase
            .from('sectors')
            .update({ triggers: updatedTriggers })
            .eq('id', sector_id);

        if (updateSectorError) {
            console.error('Failed to update sector triggers:', updateSectorError);
            return NextResponse.json({ error: 'Failed to retrain AI' }, { status: 500 });
        }

        // 4. Re-route the conversation so it leaves the "Fallback widget"
        const { error: convError } = await supabase
            .from('conversations')
            .update({
                sector_id: sector_id,
                routed_by: 'manual', // Removes it from fallback stats!
                status: 'pending_triage'
            })
            .eq('id', conversation_id)
            .eq('organization_id', orgId);

        if (convError) {
            console.error('Failed to update conversation:', convError);
            // Non-critical, AI was trained anyway
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Retrain route error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
