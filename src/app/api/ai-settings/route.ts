import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema for updating settings
const settingsSchema = z.object({
    ai_provider: z.string().optional(),
    ai_model: z.string().optional(),
    ai_temperature: z.number().min(0).max(2).optional(),
    custom_prompt_base: z.string().optional(),
    persona_name: z.string().optional(),
    persona_description: z.string().optional(),
    persona_instructions: z.string().optional(),
});

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get organization ID via profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        // Fetch settings and active persona
        const [{ data: settings }, { data: personas }] = await Promise.all([
            supabase.from('organization_settings').select('*').eq('organization_id', profile.organization_id).single(),
            supabase.from('ai_personas').select('*').eq('organization_id', profile.organization_id).eq('is_active', true)
        ]);

        return NextResponse.json({
            settings: settings || null,
            persona: personas?.[0] || null
        });
    } catch (error) {
        console.error('[API] Error fetching AI Settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const parsed = settingsSchema.parse(body);

        // Get organzation ID
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
        if (!profile?.organization_id) return NextResponse.json({ error: 'Org not found' }, { status: 404 });

        const orgId = profile.organization_id;

        // Update settings
        const settingsPayload = {
            ...(parsed.ai_provider && { ai_provider: parsed.ai_provider }),
            ...(parsed.ai_model && { ai_model: parsed.ai_model }),
            ...(parsed.ai_temperature !== undefined && { ai_temperature: parsed.ai_temperature }),
            ...(parsed.custom_prompt_base !== undefined && { custom_prompt_base: parsed.custom_prompt_base }),
            updated_at: new Date().toISOString()
        };

        if (Object.keys(settingsPayload).length > 1) { // more than just updated_at
            await supabase
                .from('organization_settings')
                .upsert({ organization_id: orgId, ...settingsPayload });
        }

        // Update active persona
        if (parsed.persona_name || parsed.persona_description || parsed.persona_instructions) {
            // Check if one exists
            const { data: existingPersona } = await supabase
                .from('ai_personas')
                .select('id')
                .eq('organization_id', orgId)
                .eq('is_active', true)
                .single();

            const personaPayload = {
                organization_id: orgId,
                is_active: true,
                ...(parsed.persona_name && { name: parsed.persona_name }),
                ...(parsed.persona_description !== undefined && { description: parsed.persona_description }),
                ...(parsed.persona_instructions !== undefined && { prompt_instructions: parsed.persona_instructions }),
            };

            if (existingPersona) {
                await supabase.from('ai_personas').update(personaPayload).eq('id', existingPersona.id);
            } else {
                await supabase.from('ai_personas').insert(personaPayload);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] Error updating AI Settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
