-- ============================================================================
-- DATABASE SCHEMA FOR SIGNUP FLOW WITH PROFILES AND ROLES
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ROLES TABLE
-- ============================================================================

-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default "user" role
INSERT INTO public.roles (name, description)
VALUES ('user', 'Default user role')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    role_id UUID NOT NULL REFERENCES public.roles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on role_id for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);

-- ============================================================================
-- TRIGGER FUNCTION TO SET DEFAULT ROLE_ID ON PROFILE INSERT
-- ============================================================================

-- Function to set default role_id when inserting a profile
CREATE OR REPLACE FUNCTION public.set_default_role_id()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
BEGIN
    -- If role_id is not provided, set it to the default "user" role
    IF NEW.role_id IS NULL THEN
        -- Get the default "user" role ID
        SELECT id INTO default_role_id
        FROM public.roles
        WHERE name = 'user'
        LIMIT 1;

        -- If role doesn't exist, create it
        IF default_role_id IS NULL THEN
            INSERT INTO public.roles (name, description)
            VALUES ('user', 'Default user role')
            RETURNING id INTO default_role_id;
        END IF;

        NEW.role_id := default_role_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to set default role_id before profile insert
DROP TRIGGER IF EXISTS set_default_role_on_profile_insert ON public.profiles;
CREATE TRIGGER set_default_role_on_profile_insert
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_default_role_id();

-- ============================================================================
-- TRIGGER FUNCTION TO AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
BEGIN
    -- Get the default "user" role ID
    SELECT id INTO default_role_id
    FROM public.roles
    WHERE name = 'user'
    LIMIT 1;

    -- If role doesn't exist, create it
    IF default_role_id IS NULL THEN
        INSERT INTO public.roles (name, description)
        VALUES ('user', 'Default user role')
        RETURNING id INTO default_role_id;
    END IF;

    -- Note: Profile will be created by the signup action with user data
    -- This trigger is here for reference but profile creation happens
    -- in the application code to include first_name, last_name, date_of_birth
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users insert
-- Note: This trigger ensures the user exists, but profile creation
-- happens in the application code to include user-provided data
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FUNCTION TO UPDATE UPDATED_AT TIMESTAMP
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for roles updated_at
DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Policy: Allow authenticated users to insert their own profile
-- (This is needed for the signup process)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy: Everyone can read roles (for dropdowns, etc.)
DROP POLICY IF EXISTS "Everyone can read roles" ON public.roles;
CREATE POLICY "Everyone can read roles"
    ON public.roles
    FOR SELECT
    USING (true);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.roles TO anon, authenticated;

