-- Drop the "Users can view own invitations" policy
-- This policy was causing permission errors because it tried to access auth.users directly
-- All user access to invitations goes through the get_invitation_by_token RPC function (SECURITY DEFINER)
-- which bypasses RLS, making this policy unnecessary
DROP POLICY IF EXISTS "Users can view own invitations" ON organization_invitations;
