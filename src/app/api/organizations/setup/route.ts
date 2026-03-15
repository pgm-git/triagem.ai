import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WizardData } from '@/types';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = (await request.json()) as WizardData;
        const { persona, sectors, fallback } = body;

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

        // 1. Update Organization persona_traits and setup_complete
        const { error: orgError } = await supabase
            .from('organizations')
            .update({
                persona_traits: persona?.selectedTraits || [],
                setup_complete: true
            })
            .eq('id', orgId);

        if (orgError) throw orgError;

        // 2. Update existing sectors destination
        if (sectors && sectors.length > 0) {
            for (const sector of sectors) {
                if (sector.id && sector.destination) {
                    await supabase
                        .from('sectors')
                        .update({ destination: sector.destination })
                        .eq('id', sector.id)
                        .eq('organization_id', orgId);
                }
            }
        }

        // 3. Handle Fallback message if it was changed
        if (fallback && fallback.message) {
            await supabase
                .from('sectors')
                .update({
                    fallback_message: fallback.message,
                })
                .eq('organization_id', orgId)
                .eq('is_fallback', true);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Setup API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
