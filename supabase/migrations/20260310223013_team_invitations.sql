-- Criar a tabela de convites
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'agent',
    token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '7 days')
);

-- Habilitar RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Invites are viewable by users in the same organization" 
    ON public.invitations FOR SELECT 
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Invites can be created by admins" 
    ON public.invitations FOR INSERT 
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

CREATE POLICY "Invites can be updated by admins" 
    ON public.invitations FOR UPDATE 
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

-- Refatorar a Trigger de Registro (handle_new_user)
-- O objetivo é ler o token ou organization_id do raw_user_meta_data para não criar org nova
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    invited_org_id UUID;
    invite_role TEXT;
    provided_name TEXT;
BEGIN
    -- Verificar se é um aceite de convite (tem token e organization_id no metadata)
    invited_org_id := (new.raw_user_meta_data->>'organization_id')::UUID;
    invite_role := (new.raw_user_meta_data->>'role');
    provided_name := (new.raw_user_meta_data->>'full_name');

    IF invited_org_id IS NOT NULL THEN
        -- Usuário está entrando via convite
        new_org_id := invited_org_id;
        
        -- Atualizar o convite para 'accepted'
        IF (new.raw_user_meta_data->>'invite_token') IS NOT NULL THEN
            UPDATE public.invitations 
            SET status = 'accepted' 
            WHERE token = (new.raw_user_meta_data->>'invite_token')::UUID 
            AND status = 'pending';
        END IF;
    ELSE
        -- Fluxo Normal: Criar nova organização
        INSERT INTO public.organizations (name, slug)
        VALUES (
            COALESCE(new.raw_user_meta_data->>'company_name', 'Minha Empresa'),
            LOWER(REGEXP_REPLACE(COALESCE(new.raw_user_meta_data->>'company_name', 'empresa-' || substr(new.id::text, 1, 6)), '[^a-zA-Z0-9]', '-', 'g'))
        ) RETURNING id INTO new_org_id;
        
        invite_role := 'owner'; -- O criador da conta é sempre owner/admin
    END IF;

    -- Criar o profile
    INSERT INTO public.profiles (id, full_name, email, role, organization_id)
    VALUES (
        new.id,
        COALESCE(provided_name, split_part(new.email, '@', 1)),
        new.email,
        COALESCE(invite_role, 'owner'),
        new_org_id
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
