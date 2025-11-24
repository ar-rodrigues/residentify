# Supabase Schema

| table_name               | column_name          | data_type                | is_nullable | column_default               | is_primary_key | referenced_table_name | referenced_column_name |
| ------------------------ | -------------------- | ------------------------ | ----------- | ---------------------------- | -------------- | --------------------- | ---------------------- |
| access_logs              | id                   | uuid                     | NO          | uuid_generate_v4()           | true           | null                  | null                   |
| access_logs              | qr_code_id           | uuid                     | NO          | null                         | false          | qr_codes              | id                     |
| access_logs              | scanned_by           | uuid                     | NO          | null                         | false          | null                  | null                   |
| access_logs              | organization_id      | uuid                     | NO          | null                         | false          | organizations         | id                     |
| access_logs              | entry_type           | USER-DEFINED             | NO          | null                         | false          | null                  | null                   |
| access_logs              | timestamp            | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| organization_invitations | id                   | uuid                     | NO          | uuid_generate_v4()           | true           | null                  | null                   |
| organization_invitations | organization_id      | uuid                     | NO          | null                         | false          | organizations         | id                     |
| organization_invitations | email                | text                     | NO          | null                         | false          | null                  | null                   |
| organization_invitations | token                | text                     | NO          | null                         | false          | null                  | null                   |
| organization_invitations | invited_by           | uuid                     | NO          | null                         | false          | null                  | null                   |
| organization_invitations | status               | USER-DEFINED             | YES         | 'pending'::invitation_status | false          | null                  | null                   |
| organization_invitations | expires_at           | timestamp with time zone | NO          | null                         | false          | null                  | null                   |
| organization_invitations | created_at           | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| organization_invitations | updated_at           | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| organization_invitations | organization_role_id | integer                  | NO          | null                         | false          | organization_roles    | id                     |
| organization_invitations | first_name           | text                     | NO          | null                         | false          | null                  | null                   |
| organization_invitations | last_name            | text                     | NO          | null                         | false          | null                  | null                   |
| organization_invitations | description          | text                     | YES         | null                         | false          | null                  | null                   |
| organization_members     | id                   | uuid                     | NO          | uuid_generate_v4()           | true           | null                  | null                   |
| organization_members     | user_id              | uuid                     | NO          | null                         | false          | null                  | null                   |
| organization_members     | organization_id      | uuid                     | NO          | null                         | false          | organizations         | id                     |
| organization_members     | invited_by           | uuid                     | YES         | null                         | false          | null                  | null                   |
| organization_members     | joined_at            | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| organization_members     | created_at           | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| organization_members     | updated_at           | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| organization_members     | organization_role_id | integer                  | NO          | null                         | false          | organization_roles    | id                     |
| organization_roles       | id                   | integer                  | NO          | null                         | true           | null                  | null                   |
| organization_roles       | name                 | text                     | NO          | null                         | false          | null                  | null                   |
| organization_roles       | description          | text                     | YES         | null                         | false          | null                  | null                   |
| organization_roles       | created_at           | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| organization_roles       | updated_at           | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| organizations            | id                   | uuid                     | NO          | uuid_generate_v4()           | true           | null                  | null                   |
| organizations            | name                 | text                     | NO          | null                         | false          | null                  | null                   |
| organizations            | created_by           | uuid                     | NO          | null                         | false          | null                  | null                   |
| organizations            | created_at           | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| organizations            | updated_at           | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| profiles                 | id                   | uuid                     | NO          | null                         | true           | null                  | null                   |
| profiles                 | first_name           | text                     | NO          | null                         | false          | null                  | null                   |
| profiles                 | last_name            | text                     | NO          | null                         | false          | null                  | null                   |
| profiles                 | date_of_birth        | date                     | NO          | null                         | false          | null                  | null                   |
| profiles                 | role_id              | uuid                     | NO          | null                         | false          | roles                 | id                     |
| profiles                 | created_at           | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| profiles                 | updated_at           | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| qr_codes                 | id                   | uuid                     | NO          | uuid_generate_v4()           | true           | null                  | null                   |
| qr_codes                 | code                 | text                     | NO          | null                         | false          | null                  | null                   |
| qr_codes                 | organization_id      | uuid                     | NO          | null                         | false          | organizations         | id                     |
| qr_codes                 | created_by           | uuid                     | NO          | null                         | false          | null                  | null                   |
| qr_codes                 | visitor_name         | text                     | NO          | null                         | false          | null                  | null                   |
| qr_codes                 | visitor_email        | text                     | YES         | null                         | false          | null                  | null                   |
| qr_codes                 | visitor_phone        | text                     | YES         | null                         | false          | null                  | null                   |
| qr_codes                 | is_used              | boolean                  | YES         | false                        | false          | null                  | null                   |
| qr_codes                 | expires_at           | timestamp with time zone | NO          | null                         | false          | null                  | null                   |
| qr_codes                 | created_at           | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| roles                    | id                   | uuid                     | NO          | uuid_generate_v4()           | true           | null                  | null                   |
| roles                    | name                 | text                     | NO          | null                         | false          | null                  | null                   |
| roles                    | description          | text                     | YES         | null                         | false          | null                  | null                   |
| roles                    | created_at           | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |
| roles                    | updated_at           | timestamp with time zone | YES         | now()                        | false          | null                  | null                   |

## RLS Policies

| schemaname | tablename                | policyname                                                   | permissive | roles    | cmd    | qual                                                                                                                                                                                                                                                                                  | with_check                                                                                                                                                                                                                                                                                                                                                              |
| ---------- | ------------------------ | ------------------------------------------------------------ | ---------- | -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| public     | access_logs              | Admins can view organization access logs                     | PERMISSIVE | {public} | SELECT | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = access_logs.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))              | null                                                                                                                                                                                                                                                                                                                                                                    |
| public     | access_logs              | Residents can view own QR code access logs                   | PERMISSIVE | {public} | SELECT | (EXISTS ( SELECT 1
   FROM qr_codes
  WHERE ((qr_codes.id = access_logs.qr_code_id) AND (qr_codes.created_by = auth.uid()))))                                                                                                                                                         | null                                                                                                                                                                                                                                                                                                                                                                    |
| public     | access_logs              | Security can create access logs                              | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                  | ((auth.uid() = scanned_by) AND (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = access_logs.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'security_personnel'::text)))))                                                   |
| public     | access_logs              | Security can view organization access logs                   | PERMISSIVE | {public} | SELECT | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = access_logs.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'security_personnel'::text)))) | null                                                                                                                                                                                                                                                                                                                                                                    |
| public     | organization_invitations | Admins can create invitations                                | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                  | ((auth.uid() = invited_by) AND (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = organization_invitations.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text)))))                                                   |
| public     | organization_invitations | Admins can delete invitations                                | PERMISSIVE | {public} | DELETE | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = organization_invitations.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text)))) | null                                                                                                                                                                                                                                                                                                                                                                    |
| public     | organization_invitations | Admins can update invitations                                | PERMISSIVE | {public} | UPDATE | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = organization_invitations.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text)))) | null                                                                                                                                                                                                                                                                                                                                                                    |
| public     | organization_invitations | Admins can view organization invitations                     | PERMISSIVE | {public} | SELECT | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = organization_invitations.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text)))) | null                                                                                                                                                                                                                                                                                                                                                                    |
| public     | organization_invitations | Users can view own invitations                               | PERMISSIVE | {public} | SELECT | ((email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text) AND (status = 'pending'::invitation_status))                                                                                                                                              | null                                                                                                                                                                                                                                                                                                                                                                    |
| public     | organization_members     | Admins can add organization members                          | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                  | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = organization_members.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))                                                                                       |
| public     | organization_members     | Admins can remove organization members                       | PERMISSIVE | {public} | DELETE | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = organization_members.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))     | null                                                                                                                                                                                                                                                                                                                                                                    |
| public     | organization_members     | Admins can update member roles                               | PERMISSIVE | {public} | UPDATE | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = organization_members.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))     | null                                                                                                                                                                                                                                                                                                                                                                    |
| public     | organization_members     | Users can add themselves as admin when creating organization | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                  | ((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM organizations
  WHERE ((organizations.id = organization_members.organization_id) AND (organizations.created_by = auth.uid())))) AND (EXISTS ( SELECT 1
   FROM organization_roles
  WHERE ((organization_roles.id = organization_members.organization_role_id) AND (organization_roles.name = 'admin'::text))))) |
| public     | organization_members     | Users can leave organization                                 | PERMISSIVE | {public} | DELETE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                                                                                                                                                                    |
| public     | organization_members     | Users can view organization members                          | PERMISSIVE | {public} | SELECT | is_user_organization_member(auth.uid(), organization_id)                                                                                                                                                                                                                              | null                                                                                                                                                                                                                                                                                                                                                                    |
| public     | organization_members     | Users can view own memberships                               | PERMISSIVE | {public} | SELECT | (auth.uid() = user_id)                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                                                                                                                                                                    |
| public     | organization_roles       | Everyone can read organization roles                         | PERMISSIVE | {public} | SELECT | true                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                                                                                                                                                                    |
| public     | organizations            | Organization admins can delete organization                  | PERMISSIVE | {public} | DELETE | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = organizations.id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))                         | null                                                                                                                                                                                                                                                                                                                                                                    |
| public     | organizations            | Organization admins can update organization                  | PERMISSIVE | {public} | UPDATE | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = organizations.id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))                         | null                                                                                                                                                                                                                                                                                                                                                                    |
| public     | organizations            | Users can create organizations                               | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                  | (auth.uid() = created_by)                                                                                                                                                                                                                                                                                                                                               |
| public     | organizations            | Users can view organizations they belong to                  | PERMISSIVE | {public} | SELECT | (EXISTS ( SELECT 1
   FROM organization_members
  WHERE ((organization_members.organization_id = organizations.id) AND (organization_members.user_id = auth.uid()))))                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                                                    |
| public     | profiles                 | Users can insert own profile                                 | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                  | (auth.uid() = id)                                                                                                                                                                                                                                                                                                                                                       |
| public     | profiles                 | Users can update own profile                                 | PERMISSIVE | {public} | UPDATE | (auth.uid() = id)                                                                                                                                                                                                                                                                     | null                                                                                                                                                                                                                                                                                                                                                                    |
| public     | profiles                 | Users can view own profile                                   | PERMISSIVE | {public} | SELECT | (auth.uid() = id)                                                                                                                                                                                                                                                                     | null                                                                                                                                                                                                                                                                                                                                                                    |
| public     | qr_codes                 | Admins can view organization QR codes                        | PERMISSIVE | {public} | SELECT | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = qr_codes.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))                 | null                                                                                                                                                                                                                                                                                                                                                                    |
| public     | qr_codes                 | Residents can create QR codes                                | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                  | ((auth.uid() = created_by) AND (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = qr_codes.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'resident'::text)))))                                                                |
| public     | qr_codes                 | Residents can update own QR codes                            | PERMISSIVE | {public} | UPDATE | ((auth.uid() = created_by) AND (is_used = false))                                                                                                                                                                                                                                     | null                                                                                                                                                                                                                                                                                                                                                                    |
| public     | qr_codes                 | Residents can view own QR codes                              | PERMISSIVE | {public} | SELECT | (auth.uid() = created_by)                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                                                                                                                                                                    |
| public     | qr_codes                 | Security can mark QR codes as used                           | PERMISSIVE | {public} | UPDATE | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = qr_codes.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'security_personnel'::text))))    | null                                                                                                                                                                                                                                                                                                                                                                    |
| public     | qr_codes                 | Security can view organization QR codes                      | PERMISSIVE | {public} | SELECT | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = qr_codes.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'security_personnel'::text))))    | null                                                                                                                                                                                                                                                                                                                                                                    |
| public     | roles                    | Everyone can read roles                                      | PERMISSIVE | {public} | SELECT | true                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                                                                                                                                                                    |


### Supabase Functions

| routine_schema | routine_name                   | routine_type | return_type | security_type | routine_definition | function_arguments | function_result | language | volatility | is_strict | is_security_definer |
| -------------- | ------------------------------ | ------------ | ----------- | ------------- | ------------------ | ------------------ | --------------- | -------- | ---------- | --------- | ------------------- |
| public         | accept_organization_invitation | FUNCTION     | record      | DEFINER       |

DECLARE
v_invitation RECORD;
v_member_id UUID;
v_existing_member UUID;
BEGIN
-- Fetch and validate the invitation
SELECT
oi.id,
oi.organization_id,
oi.organization_role_id,
oi.invited_by,
oi.status,
oi.expires_at,
oi.email
INTO v_invitation
FROM public.organization_invitations oi
WHERE oi.token = p_token
LIMIT 1;

-- Check if invitation exists
IF v_invitation.id IS NULL THEN
RAISE EXCEPTION 'Invitación no encontrada o token inválido.'
USING ERRCODE = 'P0001';
END IF;

-- Check if invitation is expired
IF v_invitation.expires_at < NOW() THEN
RAISE EXCEPTION 'Esta invitación ha expirado.'
USING ERRCODE = 'P0002';
END IF;

-- Check if invitation is still pending
IF v_invitation.status != 'pending' THEN
RAISE EXCEPTION 'Esta invitación ya ha sido aceptada o cancelada.'
USING ERRCODE = 'P0003';
END IF;

-- Check if user is already a member
SELECT om.id INTO v_existing_member
FROM public.organization_members om
WHERE om.organization_id = v_invitation.organization_id
AND om.user_id = p_user_id
LIMIT 1;

IF v_existing_member IS NOT NULL THEN
RAISE EXCEPTION 'Ya eres miembro de esta organización.'
USING ERRCODE = '23505';
END IF;

-- Add user to organization
INSERT INTO public.organization_members (
user_id,
organization_id,
organization_role_id,
invited_by,
joined_at
)
VALUES (
p_user_id,
v_invitation.organization_id,
v_invitation.organization_role_id,
v_invitation.invited_by,
NOW()
)
RETURNING id INTO v_member_id;

-- Update invitation status to accepted
UPDATE public.organization_invitations
SET
status = 'accepted',
updated_at = NOW()
WHERE id = v_invitation.id;

-- Return the created member record
RETURN QUERY
SELECT
om.id,
om.user_id,
om.organization_id,
om.organization_role_id,
om.joined_at
FROM public.organization_members om
WHERE om.id = v_member_id;
END;
| p_token text, p_user_id uuid | TABLE(member_id uuid, user_id uuid, organization_id uuid, organization_role_id integer, joined_at timestamp with time zone) | plpgsql | VOLATILE | false | true |
| public | check_user_exists_by_email | FUNCTION | boolean | DEFINER |
DECLARE
v_user_exists BOOLEAN;
BEGIN
-- Check if user exists in auth.users
SELECT EXISTS(
SELECT 1
FROM auth.users
WHERE email = LOWER(TRIM(p_email))
) INTO v_user_exists;

RETURN v_user_exists;
END;
| p_email text | boolean | plpgsql | VOLATILE | false | true |
| public | create_organization_invitation | FUNCTION | record | DEFINER |
DECLARE
v_invitation_id UUID;
v_existing_invitation UUID;
BEGIN
-- Check for duplicate pending invitations
-- Use table alias to avoid ambiguity with RETURNS TABLE id column
SELECT oi.id INTO v_existing_invitation
FROM public.organization_invitations oi
WHERE oi.organization_id = p_organization_id
AND oi.email = LOWER(TRIM(p_email))
AND oi.status = 'pending'
LIMIT 1;

IF v_existing_invitation IS NOT NULL THEN
RAISE EXCEPTION 'Ya existe una invitación pendiente para este email en esta organización.'
USING ERRCODE = '23505';
END IF;

-- Create the invitation
INSERT INTO public.organization_invitations (
organization_id,
email,
token,
organization_role_id,
invited_by,
status,
expires_at,
first_name,
last_name,
description
)
VALUES (
p_organization_id,
LOWER(TRIM(p_email)),
p_token,
p_organization_role_id,
p_invited_by,
'pending',
p_expires_at,
TRIM(p_first_name),
TRIM(p_last_name),
CASE WHEN p_description IS NOT NULL THEN TRIM(p_description) ELSE NULL END
)
RETURNING organization_invitations.id INTO v_invitation_id;

-- Return the created invitation
RETURN QUERY
SELECT
oi.id,
oi.organization_id,
oi.email,
oi.token,
oi.organization_role_id,
oi.invited_by,
oi.status::TEXT,
oi.expires_at,
oi.first_name,
oi.last_name,
oi.description,
oi.created_at,
oi.updated_at
FROM public.organization_invitations oi
WHERE oi.id = v_invitation_id;
END;
| p_organization_id uuid, p_email text, p_token text, p_organization_role_id integer, p_invited_by uuid, p_expires_at timestamp with time zone, p_first_name text, p_last_name text, p_description text | TABLE(id uuid, organization_id uuid, email text, token text, organization_role_id integer, invited_by uuid, status text, expires_at timestamp with time zone, first_name text, last_name text, description text, created_at timestamp with time zone, updated_at timestamp with time zone) | plpgsql | VOLATILE | false | true |
| public | create_organization_with_admin | FUNCTION | record | DEFINER |
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
| org_name text, creator_user_id uuid | TABLE(organization_id uuid, organization_name text, created_by uuid, created_at timestamp with time zone, member_id uuid, member_role_id integer, member_role_name text) | plpgsql | VOLATILE | false | true |
| public | create_user_profile | FUNCTION | void | DEFINER |
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
| p_user_id uuid, p_first_name text, p_last_name text, p_date_of_birth date, p_role_id uuid | void | plpgsql | VOLATILE | false | true |
| public | get_invitation_by_token | FUNCTION | record | DEFINER |
BEGIN
RETURN QUERY
SELECT
oi.id,
oi.email,
oi.first_name,
oi.last_name,
oi.description,
oi.status::TEXT,
oi.expires_at,
oi.created_at,
oi.organization_id,
oi.organization_role_id,
oi.invited_by,
o.name AS organization_name,
or_role.id AS role_id,
or_role.name AS role_name,
or_role.description AS role_description
FROM public.organization_invitations oi
INNER JOIN public.organizations o ON o.id = oi.organization_id
INNER JOIN public.organization_roles or_role ON or_role.id = oi.organization_role_id
WHERE oi.token = p_token;
END;
| p_token text | TABLE(id uuid, email text, first_name text, last_name text, description text, status text, expires_at timestamp with time zone, created_at timestamp with time zone, organization_id uuid, organization_role_id integer, invited_by uuid, organization_name text, role_id integer, role_name text, role_description text) | plpgsql | VOLATILE | false | true |
| public | get_user_name | FUNCTION | text | DEFINER |
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
| p_user_id uuid | text | plpgsql | STABLE | false | true |
| public | handle_new_user | FUNCTION | trigger | DEFINER |
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
| | trigger | plpgsql | VOLATILE | false | true |
| public | is_user_organization_member | FUNCTION | boolean | DEFINER |
BEGIN
RETURN EXISTS (
SELECT 1
FROM public.organization_members
WHERE user_id = p_user_id
AND organization_id = p_organization_id
);
END;
| p_user_id uuid, p_organization_id uuid | boolean | plpgsql | STABLE | false | true |
| public | set_default_role_id | FUNCTION | trigger | DEFINER |
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
| | trigger | plpgsql | VOLATILE | false | true |
| public | update_updated_at_column | FUNCTION | trigger | INVOKER |
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;
| | trigger | plpgsql | VOLATILE | false | false |
| public | update_updated_at_column | FUNCTION | trigger | INVOKER |
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;
| | trigger | plpgsql | VOLATILE | false | false |
