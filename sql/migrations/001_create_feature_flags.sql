-- Migration: Create feature_flags and user_flags tables
-- Date: 2024
-- Description: Adds feature flags system with admin-only access

-- Create feature_flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_flags table
CREATE TABLE IF NOT EXISTS public.user_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_flag_id UUID NOT NULL REFERENCES public.feature_flags(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, feature_flag_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_flags_user_id ON public.user_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_flags_feature_flag_id ON public.user_flags(feature_flag_id);

-- Create function to check if user is app-level admin
CREATE OR REPLACE FUNCTION public.is_app_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles p
        INNER JOIN public.roles r ON r.id = p.role_id
        WHERE p.id = p_user_id
        AND r.name = 'admin'
    ) INTO v_is_admin;
    
    RETURN COALESCE(v_is_admin, false);
END;
$$;

-- Enable RLS on both tables
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feature_flags table (admin-only access)
CREATE POLICY "Admins can view feature flags"
    ON public.feature_flags
    FOR SELECT
    USING (public.is_app_admin(auth.uid()));

CREATE POLICY "Admins can insert feature flags"
    ON public.feature_flags
    FOR INSERT
    WITH CHECK (public.is_app_admin(auth.uid()));

CREATE POLICY "Admins can update feature flags"
    ON public.feature_flags
    FOR UPDATE
    USING (public.is_app_admin(auth.uid()))
    WITH CHECK (public.is_app_admin(auth.uid()));

CREATE POLICY "Admins can delete feature flags"
    ON public.feature_flags
    FOR DELETE
    USING (public.is_app_admin(auth.uid()));

-- RLS Policies for user_flags table (admin-only access)
CREATE POLICY "Admins can view user flags"
    ON public.user_flags
    FOR SELECT
    USING (public.is_app_admin(auth.uid()));

CREATE POLICY "Admins can insert user flags"
    ON public.user_flags
    FOR INSERT
    WITH CHECK (public.is_app_admin(auth.uid()));

CREATE POLICY "Admins can update user flags"
    ON public.user_flags
    FOR UPDATE
    USING (public.is_app_admin(auth.uid()))
    WITH CHECK (public.is_app_admin(auth.uid()));

CREATE POLICY "Admins can delete user flags"
    ON public.user_flags
    FOR DELETE
    USING (public.is_app_admin(auth.uid()));

-- Create trigger for updated_at on feature_flags
CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON public.feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on user_flags
CREATE TRIGGER update_user_flags_updated_at
    BEFORE UPDATE ON public.user_flags
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get user flags (bypasses RLS for API use)
-- This function allows users to read their own flags via API
CREATE OR REPLACE FUNCTION public.get_user_flags(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    enabled BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ff.id,
        ff.name,
        ff.description,
        COALESCE(uf.enabled, false) as enabled
    FROM public.feature_flags ff
    LEFT JOIN public.user_flags uf ON uf.feature_flag_id = ff.id AND uf.user_id = p_user_id
    ORDER BY ff.name;
END;
$$;


