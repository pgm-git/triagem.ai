-- Tabela para logs de depuração
CREATE TABLE IF NOT EXISTS public.debug_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    context TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger handle_new_user robusto e com logs
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    invited_org_id UUID;
    invite_role TEXT;
    provided_name TEXT;
    invite_token_val TEXT;
BEGIN
    -- Log inicial do metadado recebido
    INSERT INTO public.debug_logs (context, payload)
    VALUES ('handle_new_user_start', jsonb_build_object(
        'user_id', new.id,
        'email', new.email,
        'metadata', new.raw_user_meta_data
    ));

    -- Tentar extrair os dados do metadata
    invited_org_id := (new.raw_user_meta_data->>'organization_id')::UUID;
    invite_role := (new.raw_user_meta_data->>'role');
    provided_name := (new.raw_user_meta_data->>'full_name');
    invite_token_val := (new.raw_user_meta_data->>'invite_token');

    IF invited_org_id IS NOT NULL THEN
        -- Usuário está entrando via convite
        new_org_id := invited_org_id;
        
        -- Atualizar o convite para 'accepted'
        IF invite_token_val IS NOT NULL THEN
            UPDATE public.invitations 
            SET status = 'accepted' 
            WHERE token = invite_token_val::UUID 
            AND status = 'pending';
            
            INSERT INTO public.debug_logs (context, payload)
            VALUES ('invite_accepted_update', jsonb_build_object('token', invite_token_val, 'org_id', new_org_id));
        END IF;
    ELSE
        -- Fluxo Normal: Criar nova organização
        INSERT INTO public.organizations (name, slug)
        VALUES (
            COALESCE(new.raw_user_meta_data->>'company_name', 'Minha Empresa'),
            LOWER(REGEXP_REPLACE(COALESCE(new.raw_user_meta_data->>'company_name', 'empresa-' || substr(new.id::text, 1, 6)), '[^a-zA-Z0-9]', '-', 'g'))
        ) RETURNING id INTO new_org_id;
        
        invite_role := 'owner'; 
        
        INSERT INTO public.debug_logs (context, payload)
        VALUES ('new_org_created', jsonb_build_object('org_id', new_org_id));
    END IF;

    -- Criar o profile
    INSERT INTO public.profiles (id, full_name, email, role, organization_id)
    VALUES (
        new.id,
        COALESCE(provided_name, split_part(new.email, '@', 1)),
        new.email,
        COALESCE(invite_role, 'agent'), -- Alterado o default para agent por segurança
        new_org_id
    );

    INSERT INTO public.debug_logs (context, payload)
    VALUES ('profile_created', jsonb_build_object(
        'user_id', new.id, 
        'role', COALESCE(invite_role, 'agent'),
        'org_id', new_org_id
    ));

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.debug_logs (context, payload)
    VALUES ('handle_new_user_error', jsonb_build_object(
        'error', SQLERRM,
        'detail', SQLSTATE,
        'metadata', new.raw_user_meta_data
    ));
    RETURN new; -- Permitir o registro mesmo com erro no trigger (embora sem profile)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
