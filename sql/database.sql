-- ============================================================================
-- DATABASE SCHEMA FOR BUILDING ACCESS MANAGEMENT SYSTEM
-- Includes: Users, Profiles, Roles, Organizations, Members, QR Codes, Access Logs, Invitations
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
-- FUNCTION TO CREATE PROFILE WITH SECURITY DEFINER (BYPASSES RLS)
-- ============================================================================

-- Function to create profile during signup
-- Uses SECURITY DEFINER to bypass RLS policies
-- This is necessary because after signUp(), the session might not be immediately available
CREATE OR REPLACE FUNCTION public.create_user_profile(
    p_user_id UUID,
    p_first_name TEXT,
    p_last_name TEXT,
    p_date_of_birth DATE,
    p_role_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        first_name,
        last_name,
        date_of_birth,
        role_id
    )
    VALUES (
        p_user_id,
        p_first_name,
        p_last_name,
        p_date_of_birth,
        p_role_id
    )
    ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated, anon;

-- ============================================================================
-- FUNCTION TO GET USER NAME (BYPASSES RLS FOR ORGANIZATION CREATOR DISPLAY)
-- ============================================================================

-- Function to get user name, bypassing RLS policies
-- This allows organization members to see who created the organization
CREATE OR REPLACE FUNCTION public.get_user_name(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    v_first_name TEXT;
    v_last_name TEXT;
BEGIN
    SELECT first_name, last_name
    INTO v_first_name, v_last_name
    FROM public.profiles
    WHERE id = p_user_id;
    
    IF v_first_name IS NULL AND v_last_name IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN TRIM(COALESCE(v_first_name, '') || ' ' || COALESCE(v_last_name, ''));
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_name(UUID) TO authenticated;

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

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);
CREATE INDEX IF NOT EXISTS idx_organizations_name ON public.organizations(name);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on organizations table (policies added after organization_members is created)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create organizations (no dependency on organization_members)
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
CREATE POLICY "Users can create organizations"
    ON public.organizations
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;

-- ============================================================================
-- ORGANIZATION ROLES TABLE
-- ============================================================================

-- Create organization_roles table
CREATE TABLE IF NOT EXISTS public.organization_roles (
    id INT4 PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default organization roles with Spanish descriptions
INSERT INTO public.organization_roles (name, description)
VALUES 
    ('admin', 'Administrador de la organización'),
    ('resident', 'Residente'),
    ('security_personnel', 'Personal de seguridad')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_organization_roles_name ON public.organization_roles(name);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_organization_roles_updated_at ON public.organization_roles;
CREATE TRIGGER update_organization_roles_updated_at
    BEFORE UPDATE ON public.organization_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on organization_roles table
ALTER TABLE public.organization_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read organization roles (for dropdowns, etc.)
DROP POLICY IF EXISTS "Everyone can read organization roles" ON public.organization_roles;
CREATE POLICY "Everyone can read organization roles"
    ON public.organization_roles
    FOR SELECT
    USING (true);

GRANT SELECT ON public.organization_roles TO anon, authenticated;

-- ============================================================================
-- ORGANIZATION MEMBERS TABLE
-- ============================================================================

-- Create organization_role enum type (will be dropped after migration)
DO $$ BEGIN
    CREATE TYPE public.organization_role AS ENUM ('admin', 'resident', 'security_personnel');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create organization_members table
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    organization_role_id INT4 NOT NULL REFERENCES public.organization_roles(id),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_role_id ON public.organization_members(organization_role_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_invited_by ON public.organization_members(invited_by);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_organization_members_updated_at ON public.organization_members;
CREATE TRIGGER update_organization_members_updated_at
    BEFORE UPDATE ON public.organization_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on organization_members table
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check membership (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.is_user_organization_member(
    p_user_id UUID,
    p_organization_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.organization_members
        WHERE user_id = p_user_id
        AND organization_id = p_organization_id
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_user_organization_member(UUID, UUID) TO authenticated;

-- Policy: Users can view members of organizations they belong to
-- Uses security definer function to avoid infinite recursion
DROP POLICY IF EXISTS "Users can view organization members" ON public.organization_members;
CREATE POLICY "Users can view organization members"
    ON public.organization_members
    FOR SELECT
    USING (
        public.is_user_organization_member(auth.uid(), organization_id)
    );

-- Policy: Users can view their own memberships
DROP POLICY IF EXISTS "Users can view own memberships" ON public.organization_members;
CREATE POLICY "Users can view own memberships"
    ON public.organization_members
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Organization admins can insert members
DROP POLICY IF EXISTS "Admins can add organization members" ON public.organization_members;
CREATE POLICY "Admins can add organization members"
    ON public.organization_members
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            JOIN public.organization_roles or ON om.organization_role_id = or.id
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND or.name = 'admin'
        )
    );

-- Policy: Organization admins can update member roles
DROP POLICY IF EXISTS "Admins can update member roles" ON public.organization_members;
CREATE POLICY "Admins can update member roles"
    ON public.organization_members
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            JOIN public.organization_roles or ON om.organization_role_id = or.id
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND or.name = 'admin'
        )
    );

-- Policy: Organization admins can remove members
DROP POLICY IF EXISTS "Admins can remove organization members" ON public.organization_members;
CREATE POLICY "Admins can remove organization members"
    ON public.organization_members
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            JOIN public.organization_roles or ON om.organization_role_id = or.id
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND or.name = 'admin'
        )
    );

-- Policy: Users can leave organization themselves
DROP POLICY IF EXISTS "Users can leave organization" ON public.organization_members;
CREATE POLICY "Users can leave organization"
    ON public.organization_members
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: Users can add themselves as admin when creating organization
DROP POLICY IF EXISTS "Users can add themselves as admin when creating organization" ON public.organization_members;
CREATE POLICY "Users can add themselves as admin when creating organization"
    ON public.organization_members
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.organizations
            WHERE id = organization_members.organization_id
            AND created_by = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM public.organization_roles
            WHERE id = organization_members.organization_role_id
            AND name = 'admin'
        )
    );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;

-- ============================================================================
-- ADD RLS POLICIES TO ORGANIZATIONS (Now that organization_members exists)
-- ============================================================================

-- Policy: Users can view organizations they belong to
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;
CREATE POLICY "Users can view organizations they belong to"
    ON public.organizations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.organization_id = organizations.id
            AND organization_members.user_id = auth.uid()
        )
    );

-- Policy: Organization admins can update their organization
DROP POLICY IF EXISTS "Organization admins can update organization" ON public.organizations;
CREATE POLICY "Organization admins can update organization"
    ON public.organizations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            JOIN public.organization_roles or ON om.organization_role_id = or.id
            WHERE om.organization_id = organizations.id
            AND om.user_id = auth.uid()
            AND or.name = 'admin'
        )
    );

-- Policy: Organization admins can delete their organization
DROP POLICY IF EXISTS "Organization admins can delete organization" ON public.organizations;
CREATE POLICY "Organization admins can delete organization"
    ON public.organizations
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            JOIN public.organization_roles or ON om.organization_role_id = or.id
            WHERE om.organization_id = organizations.id
            AND om.user_id = auth.uid()
            AND or.name = 'admin'
        )
    );

-- ============================================================================
-- QR CODES TABLE
-- ============================================================================

-- Create qr_codes table
CREATE TABLE IF NOT EXISTS public.qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    visitor_name TEXT NOT NULL,
    visitor_email TEXT,
    visitor_phone TEXT,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_qr_codes_code ON public.qr_codes(code);
CREATE INDEX IF NOT EXISTS idx_qr_codes_organization_id ON public.qr_codes(organization_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_created_by ON public.qr_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_qr_codes_is_used ON public.qr_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_qr_codes_expires_at ON public.qr_codes(expires_at);

-- Enable RLS on qr_codes table
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Residents can view QR codes they created
DROP POLICY IF EXISTS "Residents can view own QR codes" ON public.qr_codes;
CREATE POLICY "Residents can view own QR codes"
    ON public.qr_codes
    FOR SELECT
    USING (auth.uid() = created_by);

-- Policy: Security personnel can view all QR codes in their organization
DROP POLICY IF EXISTS "Security can view organization QR codes" ON public.qr_codes;
CREATE POLICY "Security can view organization QR codes"
    ON public.qr_codes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            JOIN public.organization_roles or ON om.organization_role_id = or.id
            WHERE om.organization_id = qr_codes.organization_id
            AND om.user_id = auth.uid()
            AND or.name = 'security_personnel'
        )
    );

-- Policy: Admins can view all QR codes in their organization
DROP POLICY IF EXISTS "Admins can view organization QR codes" ON public.qr_codes;
CREATE POLICY "Admins can view organization QR codes"
    ON public.qr_codes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            JOIN public.organization_roles or ON om.organization_role_id = or.id
            WHERE om.organization_id = qr_codes.organization_id
            AND om.user_id = auth.uid()
            AND or.name = 'admin'
        )
    );

-- Policy: Residents can create QR codes in their organization
DROP POLICY IF EXISTS "Residents can create QR codes" ON public.qr_codes;
CREATE POLICY "Residents can create QR codes"
    ON public.qr_codes
    FOR INSERT
    WITH CHECK (
        auth.uid() = created_by
        AND EXISTS (
            SELECT 1 FROM public.organization_members om
            JOIN public.organization_roles or ON om.organization_role_id = or.id
            WHERE om.organization_id = qr_codes.organization_id
            AND om.user_id = auth.uid()
            AND or.name = 'resident'
        )
    );

-- Policy: Residents can update their own unused QR codes
DROP POLICY IF EXISTS "Residents can update own QR codes" ON public.qr_codes;
CREATE POLICY "Residents can update own QR codes"
    ON public.qr_codes
    FOR UPDATE
    USING (
        auth.uid() = created_by
        AND is_used = FALSE
    );

-- Policy: Security personnel can mark QR codes as used
DROP POLICY IF EXISTS "Security can mark QR codes as used" ON public.qr_codes;
CREATE POLICY "Security can mark QR codes as used"
    ON public.qr_codes
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            JOIN public.organization_roles or ON om.organization_role_id = or.id
            WHERE om.organization_id = qr_codes.organization_id
            AND om.user_id = auth.uid()
            AND or.name = 'security_personnel'
        )
    );

GRANT SELECT, INSERT, UPDATE ON public.qr_codes TO authenticated;

-- ============================================================================
-- ACCESS LOGS TABLE
-- ============================================================================

-- Create entry_type enum type
DO $$ BEGIN
    CREATE TYPE public.entry_type AS ENUM ('entry', 'exit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create access_logs table
CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_code_id UUID NOT NULL REFERENCES public.qr_codes(id) ON DELETE RESTRICT,
    scanned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    entry_type public.entry_type NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_access_logs_qr_code_id ON public.access_logs(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_scanned_by ON public.access_logs(scanned_by);
CREATE INDEX IF NOT EXISTS idx_access_logs_organization_id ON public.access_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_entry_type ON public.access_logs(entry_type);
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON public.access_logs(timestamp);

-- Enable RLS on access_logs table
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Security personnel can view all access logs in their organization
DROP POLICY IF EXISTS "Security can view organization access logs" ON public.access_logs;
CREATE POLICY "Security can view organization access logs"
    ON public.access_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            JOIN public.organization_roles or ON om.organization_role_id = or.id
            WHERE om.organization_id = access_logs.organization_id
            AND om.user_id = auth.uid()
            AND or.name = 'security_personnel'
        )
    );

-- Policy: Admins can view all access logs in their organization
DROP POLICY IF EXISTS "Admins can view organization access logs" ON public.access_logs;
CREATE POLICY "Admins can view organization access logs"
    ON public.access_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            JOIN public.organization_roles or ON om.organization_role_id = or.id
            WHERE om.organization_id = access_logs.organization_id
            AND om.user_id = auth.uid()
            AND or.name = 'admin'
        )
    );

-- Policy: Residents can view access logs for QR codes they created
DROP POLICY IF EXISTS "Residents can view own QR code access logs" ON public.access_logs;
CREATE POLICY "Residents can view own QR code access logs"
    ON public.access_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.qr_codes
            WHERE qr_codes.id = access_logs.qr_code_id
            AND qr_codes.created_by = auth.uid()
        )
    );

-- Policy: Security personnel can create access logs
DROP POLICY IF EXISTS "Security can create access logs" ON public.access_logs;
CREATE POLICY "Security can create access logs"
    ON public.access_logs
    FOR INSERT
    WITH CHECK (
        auth.uid() = scanned_by
        AND EXISTS (
            SELECT 1 FROM public.organization_members om
            JOIN public.organization_roles or ON om.organization_role_id = or.id
            WHERE om.organization_id = access_logs.organization_id
            AND om.user_id = auth.uid()
            AND or.name = 'security_personnel'
        )
    );

GRANT SELECT, INSERT ON public.access_logs TO authenticated;

-- ============================================================================
-- ORGANIZATION INVITATIONS TABLE
-- ============================================================================

-- Create invitation_status enum type
DO $$ BEGIN
    CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create organization_invitations table
CREATE TABLE IF NOT EXISTS public.organization_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    status public.invitation_status DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    organization_role_id INT4 NOT NULL REFERENCES public.organization_roles(id),
    UNIQUE(organization_id, email, status)
);


-- ============================================================================
-- TRIGGER FUNCTION TO SET DEFAULT ORGANIZATION_ROLE_ID ON INVITATION INSERT
-- ============================================================================

-- Function to set default organization_role_id when inserting an invitation
-- Defaults to 'resident' role if not provided
CREATE OR REPLACE FUNCTION public.set_default_organization_role_id()
RETURNS TRIGGER AS $
DECLARE
    default_role_id INT4;
BEGIN
    -- If organization_role_id is not provided, set it to the default "resident" role
    IF NEW.organization_role_id IS NULL THEN
        -- Get the default "resident" role ID
        SELECT id INTO default_role_id
        FROM public.organization_roles
        WHERE name = 'resident'
        LIMIT 1;

        -- If role doesn't exist, raise an error (should not happen as roles are seeded)
        IF default_role_id IS NULL THEN
            RAISE EXCEPTION 'Resident role not found in organization_roles table';
        END IF;

        NEW.organization_role_id := default_role_id;
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to set default organization_role_id before invitation insert
DROP TRIGGER IF EXISTS set_default_organization_role_on_invitation_insert ON public.organization_invitations;
CREATE TRIGGER set_default_organization_role_on_invitation_insert
    BEFORE INSERT ON public.organization_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_default_organization_role_id();
-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_organization_invitations_organization_id ON public.organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_email ON public.organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_token ON public.organization_invitations(token);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_status ON public.organization_invitations(status);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_invited_by ON public.organization_invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_expires_at ON public.organization_invitations(expires_at);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_organization_invitations_updated_at ON public.organization_invitations;
CREATE TRIGGER update_organization_invitations_updated_at
    BEFORE UPDATE ON public.organization_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on organization_invitations table
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view invitations for their organization
DROP POLICY IF EXISTS "Admins can view organization invitations" ON public.organization_invitations;
CREATE POLICY "Admins can view organization invitations"
    ON public.organization_invitations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            JOIN public.organization_roles or ON om.organization_role_id = or.id
            WHERE om.organization_id = organization_invitations.organization_id
            AND om.user_id = auth.uid()
            AND or.name = 'admin'
        )
    );

-- Policy: Users can view invitations sent to their email
DROP POLICY IF EXISTS "Users can view own invitations" ON public.organization_invitations;
CREATE POLICY "Users can view own invitations"
    ON public.organization_invitations
    FOR SELECT
    USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND status = 'pending'
    );

-- Policy: Admins can create invitations
DROP POLICY IF EXISTS "Admins can create invitations" ON public.organization_invitations;
CREATE POLICY "Admins can create invitations"
    ON public.organization_invitations
    FOR INSERT
    WITH CHECK (
        auth.uid() = invited_by
        AND EXISTS (
            SELECT 1 FROM public.organization_members om
            JOIN public.organization_roles or ON om.organization_role_id = or.id
            WHERE om.organization_id = organization_invitations.organization_id
            AND om.user_id = auth.uid()
            AND or.name = 'admin'
        )
    );

-- Policy: Admins can update invitations (resend, cancel)
DROP POLICY IF EXISTS "Admins can update invitations" ON public.organization_invitations;
CREATE POLICY "Admins can update invitations"
    ON public.organization_invitations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            JOIN public.organization_roles or ON om.organization_role_id = or.id
            WHERE om.organization_id = organization_invitations.organization_id
            AND om.user_id = auth.uid()
            AND or.name = 'admin'
        )
    );

-- Policy: Admins can delete invitations
DROP POLICY IF EXISTS "Admins can delete invitations" ON public.organization_invitations;
CREATE POLICY "Admins can delete invitations"
    ON public.organization_invitations
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            JOIN public.organization_roles or ON om.organization_role_id = or.id
            WHERE om.organization_id = organization_invitations.organization_id
            AND om.user_id = auth.uid()
            AND or.name = 'admin'
        )
    );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_invitations TO authenticated;

-- ============================================================================
-- DROP ENUM TYPE (after all tables are updated)
-- ============================================================================

-- Drop organization_role enum type (replaced with foreign key to organization_roles table)
DROP TYPE IF EXISTS public.organization_role;

-- ============================================================================
-- DATABASE FUNCTION FOR ATOMIC ORGANIZATION CREATION
-- ============================================================================

-- Function to create organization and add creator as admin atomically
CREATE OR REPLACE FUNCTION public.create_organization_with_admin(
    org_name TEXT,
    creator_user_id UUID
)
RETURNS TABLE (
    organization_id UUID,
    organization_name TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ,
    member_id UUID,
    member_role_id INT4,
    member_role_name TEXT
) AS $$
DECLARE
    new_org_id UUID;
    admin_role_id INT4;
    new_member_id UUID;
BEGIN
    -- Get admin role ID
    SELECT id INTO admin_role_id
    FROM public.organization_roles
    WHERE name = 'admin'
    LIMIT 1;

    IF admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Admin role not found in organization_roles table';
    END IF;

    -- Create organization
    INSERT INTO public.organizations (name, created_by)
    VALUES (org_name, creator_user_id)
    RETURNING id INTO new_org_id;

    -- Add creator as admin member
    INSERT INTO public.organization_members (user_id, organization_id, organization_role_id)
    VALUES (creator_user_id, new_org_id, admin_role_id)
    RETURNING id INTO new_member_id;

    -- Return organization and member data
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        o.created_by,
        o.created_at,
        om.id,
        om.organization_role_id,
        org_role.name
    FROM public.organizations o
    JOIN public.organization_members om ON om.organization_id = o.id
    JOIN public.organization_roles org_role ON org_role.id = om.organization_role_id
    WHERE o.id = new_org_id
    AND om.id = new_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

