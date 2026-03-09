import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WizardData } from '@/types';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = (await request.json()) as WizardData;
        const { routingType, sectors, fallback } = body;

        // Get organization ID
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        const orgId = profile.organization_id;

        // 1. Update Organization routing_type and setup_complete
        const { error: orgError } = await supabase
            .from('organizations')
            .update({
                routing_type: routingType || 'hybrid',
                setup_complete: true
            })
            .eq('id', orgId);

        if (orgError) throw orgError;

        // 2. Clear old default sectors (since they might have been created by trigger)
        // Only if sectors were provided
        if (sectors && sectors.length > 0) {
            await supabase.from('sectors').delete().eq('organization_id', orgId);

            // 3. Insert new sectors
            const newSectors = sectors.map((s, index) => ({
                organization_id: orgId,
                name: s.name || `Setor ${index + 1}`,
                icon: s.icon || '📂',
                destination: s.destination || '',
                is_active: s.is_active !== false,
                priority: s.priority ?? index,
                is_fallback: false
            }));

            // Include Fallback sector if specified (usually Ouvidoria)
            if (fallback && fallback.message) {
                newSectors.push({
                    organization_id: orgId,
                    name: 'Ouvidoria (Fallback)',
                    icon: '📢',
                    destination: '',
                    is_active: true,
                    priority: 999,
                    is_fallback: true
                });
            }

            const { error: sectorsError } = await supabase
                .from('sectors')
                .insert(newSectors);

            if (sectorsError) throw sectorsError;
        }

        // We skip rules for now since they are superseded by AI in Sprint 3.

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Setup API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
