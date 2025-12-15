1.[Supabase Schema](#supabase-schema)
2.[RLS Policies](#rls-policies)
3.[Supabase Functions](#supabase-functions)


# Supabase schema


| table_name                 | column_name            | data_type                | is_nullable | column_default                                 | is_primary_key | referenced_table_name | referenced_column_name |
| -------------------------- | ---------------------- | ------------------------ | ----------- | ---------------------------------------------- | -------------- | --------------------- | ---------------------- |
| access_logs                | id                     | uuid                     | NO          | uuid_generate_v4()                             | true           | null                  | null                   |
| access_logs                | qr_code_id             | uuid                     | NO          | null                                           | false          | qr_codes              | id                     |
| access_logs                | scanned_by             | uuid                     | NO          | null                                           | false          | null                  | null                   |
| access_logs                | organization_id        | uuid                     | NO          | null                                           | false          | organizations         | id                     |
| access_logs                | entry_type             | USER-DEFINED             | NO          | null                                           | false          | null                  | null                   |
| access_logs                | timestamp              | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| access_logs                | notification_sent      | boolean                  | YES         | false                                          | false          | null                  | null                   |
| access_logs                | notes                  | text                     | YES         | null                                           | false          | null                  | null                   |
| chat_conversations         | id                     | uuid                     | NO          | uuid_generate_v4()                             | true           | null                  | null                   |
| chat_conversations         | organization_id        | uuid                     | NO          | null                                           | false          | organizations         | id                     |
| chat_conversations         | user1_id               | uuid                     | NO          | null                                           | false          | null                  | null                   |
| chat_conversations         | user2_id               | uuid                     | NO          | null                                           | false          | null                  | null                   |
| chat_conversations         | last_message_at        | timestamp with time zone | YES         | null                                           | false          | null                  | null                   |
| chat_conversations         | created_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| chat_conversations         | updated_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| chat_messages              | id                     | uuid                     | NO          | uuid_generate_v4()                             | true           | null                  | null                   |
| chat_messages              | conversation_id        | uuid                     | NO          | null                                           | false          | chat_conversations    | id                     |
| chat_messages              | organization_id        | uuid                     | NO          | null                                           | false          | organizations         | id                     |
| chat_messages              | sender_id              | uuid                     | NO          | null                                           | false          | null                  | null                   |
| chat_messages              | recipient_id           | uuid                     | NO          | null                                           | false          | null                  | null                   |
| chat_messages              | content                | text                     | NO          | null                                           | false          | null                  | null                   |
| chat_messages              | is_read                | boolean                  | YES         | false                                          | false          | null                  | null                   |
| chat_messages              | created_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| chat_messages              | updated_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| feature_flags              | id                     | uuid                     | NO          | uuid_generate_v4()                             | true           | null                  | null                   |
| feature_flags              | name                   | text                     | NO          | null                                           | false          | null                  | null                   |
| feature_flags              | description            | text                     | YES         | null                                           | false          | null                  | null                   |
| feature_flags              | created_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| feature_flags              | updated_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| general_invite_links       | id                     | uuid                     | NO          | uuid_generate_v4()                             | true           | null                  | null                   |
| general_invite_links       | organization_id        | uuid                     | NO          | null                                           | false          | organizations         | id                     |
| general_invite_links       | organization_role_id   | integer                  | NO          | null                                           | false          | organization_roles    | id                     |
| general_invite_links       | token                  | text                     | NO          | null                                           | false          | null                  | null                   |
| general_invite_links       | requires_approval      | boolean                  | NO          | false                                          | false          | null                  | null                   |
| general_invite_links       | expires_at             | timestamp with time zone | YES         | null                                           | false          | null                  | null                   |
| general_invite_links       | created_by             | uuid                     | NO          | null                                           | false          | null                  | null                   |
| general_invite_links       | created_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| general_invite_links       | updated_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| notifications              | id                     | uuid                     | NO          | uuid_generate_v4()                             | true           | null                  | null                   |
| notifications              | organization_id        | uuid                     | NO          | null                                           | false          | organizations         | id                     |
| notifications              | qr_code_id             | uuid                     | YES         | null                                           | false          | qr_codes              | id                     |
| notifications              | access_log_id          | uuid                     | YES         | null                                           | false          | access_logs           | id                     |
| notifications              | from_user_id           | uuid                     | NO          | null                                           | false          | null                  | null                   |
| notifications              | to_user_id             | uuid                     | NO          | null                                           | false          | null                  | null                   |
| notifications              | type                   | USER-DEFINED             | NO          | null                                           | false          | null                  | null                   |
| notifications              | message                | text                     | NO          | null                                           | false          | null                  | null                   |
| notifications              | is_read                | boolean                  | YES         | false                                          | false          | null                  | null                   |
| notifications              | created_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| notifications              | updated_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| organization_chat_settings | id                     | uuid                     | NO          | uuid_generate_v4()                             | true           | null                  | null                   |
| organization_chat_settings | organization_id        | uuid                     | NO          | null                                           | false          | organizations         | id                     |
| organization_chat_settings | created_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| organization_chat_settings | updated_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| organization_invitations   | id                     | uuid                     | NO          | uuid_generate_v4()                             | true           | null                  | null                   |
| organization_invitations   | organization_id        | uuid                     | NO          | null                                           | false          | organizations         | id                     |
| organization_invitations   | email                  | text                     | NO          | null                                           | false          | null                  | null                   |
| organization_invitations   | token                  | text                     | NO          | null                                           | false          | null                  | null                   |
| organization_invitations   | invited_by             | uuid                     | NO          | null                                           | false          | null                  | null                   |
| organization_invitations   | status                 | USER-DEFINED             | YES         | 'pending'::invitation_status                   | false          | null                  | null                   |
| organization_invitations   | expires_at             | timestamp with time zone | NO          | null                                           | false          | null                  | null                   |
| organization_invitations   | created_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| organization_invitations   | updated_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| organization_invitations   | organization_role_id   | integer                  | NO          | null                                           | false          | organization_roles    | id                     |
| organization_invitations   | first_name             | text                     | NO          | null                                           | false          | null                  | null                   |
| organization_invitations   | last_name              | text                     | NO          | null                                           | false          | null                  | null                   |
| organization_invitations   | description            | text                     | YES         | null                                           | false          | null                  | null                   |
| organization_invitations   | general_invite_link_id | uuid                     | YES         | null                                           | false          | general_invite_links  | id                     |
| organization_invitations   | user_id                | uuid                     | YES         | null                                           | false          | null                  | null                   |
| organization_members       | id                     | uuid                     | NO          | uuid_generate_v4()                             | true           | null                  | null                   |
| organization_members       | user_id                | uuid                     | NO          | null                                           | false          | null                  | null                   |
| organization_members       | organization_id        | uuid                     | NO          | null                                           | false          | organizations         | id                     |
| organization_members       | invited_by             | uuid                     | YES         | null                                           | false          | null                  | null                   |
| organization_members       | joined_at              | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| organization_members       | created_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| organization_members       | updated_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| organization_members       | organization_role_id   | integer                  | NO          | null                                           | false          | organization_roles    | id                     |
| organization_roles         | id                     | integer                  | NO          | null                                           | true           | null                  | null                   |
| organization_roles         | name                   | text                     | NO          | null                                           | false          | null                  | null                   |
| organization_roles         | description            | text                     | YES         | null                                           | false          | null                  | null                   |
| organization_roles         | created_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| organization_roles         | updated_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| organization_roles         | organization_type_id   | integer                  | NO          | null                                           | false          | organization_types    | id                     |
| organization_types         | id                     | integer                  | NO          | nextval('organization_types_id_seq'::regclass) | true           | null                  | null                   |
| organization_types         | name                   | text                     | NO          | null                                           | false          | null                  | null                   |
| organization_types         | description            | text                     | YES         | null                                           | false          | null                  | null                   |
| organization_types         | created_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| organization_types         | updated_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| organizations              | id                     | uuid                     | NO          | uuid_generate_v4()                             | true           | null                  | null                   |
| organizations              | name                   | text                     | NO          | null                                           | false          | null                  | null                   |
| organizations              | created_by             | uuid                     | NO          | null                                           | false          | null                  | null                   |
| organizations              | created_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| organizations              | updated_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| organizations              | organization_type_id   | integer                  | NO          | null                                           | false          | organization_types    | id                     |
| profiles                   | id                     | uuid                     | NO          | null                                           | true           | null                  | null                   |
| profiles                   | first_name             | text                     | NO          | null                                           | false          | null                  | null                   |
| profiles                   | last_name              | text                     | NO          | null                                           | false          | null                  | null                   |
| profiles                   | date_of_birth          | date                     | NO          | null                                           | false          | null                  | null                   |
| profiles                   | role_id                | uuid                     | NO          | null                                           | false          | roles                 | id                     |
| profiles                   | created_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| profiles                   | updated_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| profiles                   | main_organization_id   | uuid                     | YES         | null                                           | false          | organizations         | id                     |
| qr_codes                   | id                     | uuid                     | NO          | uuid_generate_v4()                             | true           | null                  | null                   |
| qr_codes                   | organization_id        | uuid                     | NO          | null                                           | false          | organizations         | id                     |
| qr_codes                   | created_by             | uuid                     | NO          | null                                           | false          | null                  | null                   |
| qr_codes                   | visitor_name           | text                     | YES         | null                                           | false          | null                  | null                   |
| qr_codes                   | is_used                | boolean                  | YES         | false                                          | false          | null                  | null                   |
| qr_codes                   | expires_at             | timestamp with time zone | NO          | null                                           | false          | null                  | null                   |
| qr_codes                   | created_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| qr_codes                   | status                 | USER-DEFINED             | YES         | 'active'::qr_code_status                       | false          | null                  | null                   |
| qr_codes                   | token                  | text                     | NO          | null                                           | false          | null                  | null                   |
| qr_codes                   | visitor_id             | text                     | YES         | null                                           | false          | null                  | null                   |
| qr_codes                   | document_photo_url     | text                     | YES         | null                                           | false          | null                  | null                   |
| qr_codes                   | validated_at           | timestamp with time zone | YES         | null                                           | false          | null                  | null                   |
| qr_codes                   | validated_by           | uuid                     | YES         | null                                           | false          | null                  | null                   |
| qr_codes                   | identifier             | text                     | YES         | null                                           | false          | null                  | null                   |
| qr_codes                   | updated_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| role_chat_permissions      | id                     | uuid                     | NO          | uuid_generate_v4()                             | true           | null                  | null                   |
| role_chat_permissions      | organization_id        | uuid                     | NO          | null                                           | false          | organizations         | id                     |
| role_chat_permissions      | sender_role_id         | integer                  | NO          | null                                           | false          | organization_roles    | id                     |
| role_chat_permissions      | recipient_role_id      | integer                  | NO          | null                                           | false          | organization_roles    | id                     |
| role_chat_permissions      | created_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| roles                      | id                     | uuid                     | NO          | uuid_generate_v4()                             | true           | null                  | null                   |
| roles                      | name                   | text                     | NO          | null                                           | false          | null                  | null                   |
| roles                      | description            | text                     | YES         | null                                           | false          | null                  | null                   |
| roles                      | created_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| roles                      | updated_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| user_flags                 | id                     | uuid                     | NO          | uuid_generate_v4()                             | true           | null                  | null                   |
| user_flags                 | user_id                | uuid                     | NO          | null                                           | false          | null                  | null                   |
| user_flags                 | feature_flag_id        | uuid                     | NO          | null                                           | false          | feature_flags         | id                     |
| user_flags                 | enabled                | boolean                  | NO          | false                                          | false          | null                  | null                   |
| user_flags                 | created_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |
| user_flags                 | updated_at             | timestamp with time zone | YES         | now()                                          | false          | null                  | null                   |




## RLS Policies


| schemaname | tablename                  | policyname                                                   | permissive | roles           | cmd    | qual                                                                                                                                                                                                                                                                                                                                                                  | with_check                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------- | -------------------------- | ------------------------------------------------------------ | ---------- | --------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| public     | access_logs                | Admins can view organization access logs                     | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = access_logs.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))                                                                                              | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | access_logs                | Residents can view own QR code access logs                   | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM qr_codes
  WHERE ((qr_codes.id = access_logs.qr_code_id) AND (qr_codes.created_by = auth.uid()))))                                                                                                                                                                                                                                         | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | access_logs                | Security can create access logs                              | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                                                  | ((auth.uid() = scanned_by) AND (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = access_logs.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'security'::text)))))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| public     | access_logs                | Security can view organization access logs                   | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = access_logs.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'security'::text))))                                                                                           | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | chat_conversations         | Users can create conversations if allowed                    | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                                                  | ((EXISTS ( SELECT 1
   FROM organization_members
  WHERE ((organization_members.organization_id = chat_conversations.organization_id) AND (organization_members.user_id = auth.uid())))) AND (can_user_message_user(auth.uid(),
CASE
    WHEN (user1_id = auth.uid()) THEN user2_id
    ELSE user1_id
END, organization_id) = true) AND (EXISTS ( SELECT 1
   FROM organization_members
  WHERE ((organization_members.organization_id = chat_conversations.organization_id) AND (organization_members.user_id = ANY (ARRAY[chat_conversations.user1_id, chat_conversations.user2_id])))
  GROUP BY organization_members.organization_id
 HAVING (count(DISTINCT organization_members.user_id) = 2))))                                                                                                                                                                                                                                                                                                                                                                                                            |
| public     | chat_conversations         | Users can update their conversations                         | PERMISSIVE | {public}        | UPDATE | (((user1_id = auth.uid()) OR (user2_id = auth.uid())) AND (EXISTS ( SELECT 1
   FROM organization_members
  WHERE ((organization_members.organization_id = chat_conversations.organization_id) AND (organization_members.user_id = auth.uid())))))                                                                                                                    | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | chat_conversations         | Users can view their conversations                           | PERMISSIVE | {public}        | SELECT | (((user1_id = auth.uid()) OR (user2_id = auth.uid())) AND (EXISTS ( SELECT 1
   FROM organization_members
  WHERE ((organization_members.organization_id = chat_conversations.organization_id) AND (organization_members.user_id = auth.uid())))))                                                                                                                    | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | chat_messages              | Recipients can mark messages as read                         | PERMISSIVE | {public}        | UPDATE | ((recipient_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM organization_members
  WHERE ((organization_members.organization_id = chat_messages.organization_id) AND (organization_members.user_id = auth.uid())))))                                                                                                                                                  | ((recipient_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM organization_members
  WHERE ((organization_members.organization_id = chat_messages.organization_id) AND (organization_members.user_id = auth.uid())))))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | chat_messages              | Users can send messages if allowed                           | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                                                  | ((sender_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM organization_members
  WHERE ((organization_members.organization_id = chat_messages.organization_id) AND (organization_members.user_id = auth.uid())))) AND (can_user_message_user(auth.uid(), recipient_id, organization_id) = true) AND (EXISTS ( SELECT 1
   FROM organization_members
  WHERE ((organization_members.organization_id = chat_messages.organization_id) AND (organization_members.user_id = ANY (ARRAY[chat_messages.sender_id, chat_messages.recipient_id])))
  GROUP BY organization_members.organization_id
 HAVING (count(DISTINCT organization_members.user_id) = 2))) AND (EXISTS ( SELECT 1
   FROM chat_conversations
  WHERE ((chat_conversations.id = chat_messages.conversation_id) AND (chat_conversations.organization_id = chat_messages.organization_id) AND (((chat_conversations.user1_id = chat_messages.sender_id) AND (chat_conversations.user2_id = chat_messages.recipient_id)) OR ((chat_conversations.user1_id = chat_messages.recipient_id) AND (chat_conversations.user2_id = chat_messages.sender_id))))))) |
| public     | chat_messages              | Users can view their messages                                | PERMISSIVE | {public}        | SELECT | (((sender_id = auth.uid()) OR (recipient_id = auth.uid())) AND (EXISTS ( SELECT 1
   FROM organization_members
  WHERE ((organization_members.organization_id = chat_messages.organization_id) AND (organization_members.user_id = auth.uid())))))                                                                                                                    | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | feature_flags              | Admins can delete feature flags                              | PERMISSIVE | {public}        | DELETE | is_app_admin(auth.uid())                                                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | feature_flags              | Admins can insert feature flags                              | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                                                  | is_app_admin(auth.uid())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| public     | feature_flags              | Admins can update feature flags                              | PERMISSIVE | {public}        | UPDATE | is_app_admin(auth.uid())                                                                                                                                                                                                                                                                                                                                              | is_app_admin(auth.uid())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| public     | feature_flags              | Admins can view feature flags                                | PERMISSIVE | {public}        | SELECT | is_app_admin(auth.uid())                                                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | general_invite_links       | Admins can create organization general invite links          | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                                                  | ((auth.uid() = created_by) AND (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = general_invite_links.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text)))))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| public     | general_invite_links       | Admins can delete organization general invite links          | PERMISSIVE | {public}        | DELETE | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = general_invite_links.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))                                                                                     | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | general_invite_links       | Admins can update organization general invite links          | PERMISSIVE | {public}        | UPDATE | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = general_invite_links.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))                                                                                     | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = general_invite_links.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| public     | general_invite_links       | Admins can view organization general invite links            | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = general_invite_links.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))                                                                                     | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | general_invite_links       | Public can read general invite links by token                | PERMISSIVE | {public}        | SELECT | true                                                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | notifications              | Admins can view organization notifications                   | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = notifications.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))                                                                                            | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | notifications              | Residents can update own notifications                       | PERMISSIVE | {public}        | UPDATE | (auth.uid() = to_user_id)                                                                                                                                                                                                                                                                                                                                             | (auth.uid() = to_user_id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| public     | notifications              | Residents can view own notifications                         | PERMISSIVE | {public}        | SELECT | (auth.uid() = to_user_id)                                                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | notifications              | Security can create notifications                            | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                                                  | ((auth.uid() = from_user_id) AND (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = notifications.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'security'::text)))))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| public     | organization_chat_settings | Admins can update chat settings                              | PERMISSIVE | {public}        | UPDATE | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = organization_chat_settings.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))                                                                               | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | organization_chat_settings | Members can read chat settings                               | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM organization_members
  WHERE ((organization_members.organization_id = organization_chat_settings.organization_id) AND (organization_members.user_id = auth.uid()))))                                                                                                                                                                       | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | organization_invitations   | Admins can create invitations                                | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                                                  | ((auth.uid() = invited_by) AND (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = organization_invitations.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text)))))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public     | organization_invitations   | Admins can delete invitations                                | PERMISSIVE | {public}        | DELETE | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = organization_invitations.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))                                                                                 | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | organization_invitations   | Admins can update invitations                                | PERMISSIVE | {public}        | UPDATE | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = organization_invitations.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))                                                                                 | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | organization_invitations   | Admins can view organization invitations                     | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = organization_invitations.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))                                                                                 | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | organization_invitations   | Users can view own pending invitations                       | PERMISSIVE | {public}        | SELECT | ((status = ANY (ARRAY['pending'::invitation_status, 'pending_approval'::invitation_status])) AND ((user_id = auth.uid()) OR ((user_id IS NULL) AND (lower(TRIM(BOTH FROM email)) = lower(TRIM(BOTH FROM (auth.jwt() ->> 'email'::text)))))))                                                                                                                          | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | organization_members       | Admins can add organization members                          | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                                                  | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = organization_members.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| public     | organization_members       | Admins can remove organization members                       | PERMISSIVE | {public}        | DELETE | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = organization_members.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))                                                                                     | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | organization_members       | Admins can update member roles                               | PERMISSIVE | {public}        | UPDATE | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = organization_members.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))                                                                                     | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | organization_members       | Users can add themselves as admin when creating organization | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                                                  | ((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM organizations
  WHERE ((organizations.id = organization_members.organization_id) AND (organizations.created_by = auth.uid())))) AND (EXISTS ( SELECT 1
   FROM organization_roles
  WHERE ((organization_roles.id = organization_members.organization_role_id) AND (organization_roles.name = 'admin'::text)))))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| public     | organization_members       | Users can leave organization                                 | PERMISSIVE | {public}        | DELETE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | organization_members       | Users can view organization members                          | PERMISSIVE | {public}        | SELECT | is_user_organization_member(auth.uid(), organization_id)                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | organization_members       | Users can view own memberships                               | PERMISSIVE | {public}        | SELECT | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | organization_roles         | Everyone can read organization roles                         | PERMISSIVE | {public}        | SELECT | true                                                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | organization_types         | Everyone can read organization types                         | PERMISSIVE | {public}        | SELECT | true                                                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | organizations              | Organization admins can delete organization                  | PERMISSIVE | {public}        | DELETE | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = organizations.id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))                                                                                                         | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | organizations              | Organization admins can update organization                  | PERMISSIVE | {public}        | UPDATE | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = organizations.id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))                                                                                                         | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | organizations              | Users can create organizations                               | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = created_by)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| public     | organizations              | Users can view organizations they belong to                  | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM organization_members
  WHERE ((organization_members.organization_id = organizations.id) AND (organization_members.user_id = auth.uid()))))                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | organizations              | Users can view organizations with pending invitations        | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM organization_invitations oi
  WHERE ((oi.organization_id = organizations.id) AND (oi.status = ANY (ARRAY['pending'::invitation_status, 'pending_approval'::invitation_status])) AND ((oi.user_id = auth.uid()) OR ((oi.user_id IS NULL) AND (lower(TRIM(BOTH FROM oi.email)) = lower(TRIM(BOTH FROM (auth.jwt() ->> 'email'::text))))))))) | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | profiles                   | Organization members can view other members' profiles        | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM (organization_members om1
     JOIN organization_members om2 ON ((om1.organization_id = om2.organization_id)))
  WHERE ((om1.user_id = auth.uid()) AND (om2.user_id = profiles.id))))                                                                                                                                                      | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | profiles                   | Users can insert own profile                                 | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = id)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| public     | profiles                   | Users can update own profile                                 | PERMISSIVE | {public}        | UPDATE | (auth.uid() = id)                                                                                                                                                                                                                                                                                                                                                     | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | profiles                   | Users can view own profile                                   | PERMISSIVE | {public}        | SELECT | (auth.uid() = id)                                                                                                                                                                                                                                                                                                                                                     | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | qr_codes                   | Admins can view organization QR codes                        | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = qr_codes.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))                                                                                                 | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | qr_codes                   | Residents can create QR codes                                | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                                                  | ((auth.uid() = created_by) AND (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = qr_codes.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'resident'::text)))))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| public     | qr_codes                   | Residents can delete own QR codes                            | PERMISSIVE | {public}        | DELETE | ((auth.uid() = created_by) AND (is_used = false))                                                                                                                                                                                                                                                                                                                     | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | qr_codes                   | Residents can update own QR codes                            | PERMISSIVE | {public}        | UPDATE | ((auth.uid() = created_by) AND (is_used = false))                                                                                                                                                                                                                                                                                                                     | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | qr_codes                   | Residents can view own QR codes                              | PERMISSIVE | {public}        | SELECT | (auth.uid() = created_by)                                                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | qr_codes                   | Security can mark QR codes as used                           | PERMISSIVE | {public}        | UPDATE | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = qr_codes.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'security'::text))))                                                                                              | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | qr_codes                   | Security can view organization QR codes                      | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = qr_codes.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'security'::text))))                                                                                              | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | role_chat_permissions      | Admins can add role chat permissions                         | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                                                  | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = role_chat_permissions.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| public     | role_chat_permissions      | Admins can remove role chat permissions                      | PERMISSIVE | {public}        | DELETE | (EXISTS ( SELECT 1
   FROM (organization_members om
     JOIN organization_roles org_role ON ((om.organization_role_id = org_role.id)))
  WHERE ((om.organization_id = role_chat_permissions.organization_id) AND (om.user_id = auth.uid()) AND (org_role.name = 'admin'::text))))                                                                                    | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | role_chat_permissions      | Members can read role chat permissions                       | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM organization_members
  WHERE ((organization_members.organization_id = role_chat_permissions.organization_id) AND (organization_members.user_id = auth.uid()))))                                                                                                                                                                            | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | roles                      | Everyone can read roles                                      | PERMISSIVE | {public}        | SELECT | true                                                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | user_flags                 | Admins can delete user flags                                 | PERMISSIVE | {public}        | DELETE | is_app_admin(auth.uid())                                                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public     | user_flags                 | Admins can insert user flags                                 | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                                                  | is_app_admin(auth.uid())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| public     | user_flags                 | Admins can update user flags                                 | PERMISSIVE | {public}        | UPDATE | is_app_admin(auth.uid())                                                                                                                                                                                                                                                                                                                                              | is_app_admin(auth.uid())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| public     | user_flags                 | Admins can view user flags                                   | PERMISSIVE | {public}        | SELECT | is_app_admin(auth.uid())                                                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| storage    | objects                    | Allow authenticated users to read files flreew_0             | PERMISSIVE | {authenticated} | SELECT | ((bucket_id = 'documents'::text) AND (auth.role() = 'authenticated'::text))                                                                                                                                                                                                                                                                                           | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| storage    | objects                    | Allow authenticated users to upload files flreew_0           | PERMISSIVE | {authenticated} | INSERT | null                                                                                                                                                                                                                                                                                                                                                                  | ((bucket_id = 'documents'::text) AND (auth.role() = 'authenticated'::text))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |




### Supabase functions


| routine_schema | routine_name                             | routine_type | return_type | security_type | routine_definition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | function_arguments                                                                                                                                                                                    | function_result                                                                                                                                                                                                                                                                                                                       | language | volatility | is_strict | is_security_definer |
| -------------- | ---------------------------------------- | ------------ | ----------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- | --------- | ------------------- |
| public         | accept_organization_invitation           | FUNCTION     | record      | DEFINER       | 
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

  -- Check if invitation is expired (only if expires_at is not NULL)
  IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < NOW() THEN
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

  -- Update invitation status to accepted and set user_id
  UPDATE public.organization_invitations
  SET 
    status = 'accepted',
    user_id = p_user_id,
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | p_token text, p_user_id uuid                                                                                                                                                                          | TABLE(member_id uuid, user_id uuid, organization_id uuid, organization_role_id integer, joined_at timestamp with time zone)                                                                                                                                                                                                           | plpgsql  | VOLATILE   | false     | true                |
| public         | can_user_message_user                    | FUNCTION     | boolean     | DEFINER       | 
DECLARE
  v_sender_role_id INTEGER;
  v_recipient_role_id INTEGER;
  v_permission_exists BOOLEAN;
BEGIN
  -- Get sender's role
  SELECT organization_role_id INTO v_sender_role_id
  FROM organization_members
  WHERE user_id = p_sender_id
    AND organization_id = p_organization_id
  LIMIT 1;

  -- Get recipient's role
  SELECT organization_role_id INTO v_recipient_role_id
  FROM organization_members
  WHERE user_id = p_recipient_id
    AND organization_id = p_organization_id
  LIMIT 1;

  -- If either user is not a member, deny
  IF v_sender_role_id IS NULL OR v_recipient_role_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if a deny entry exists in role_chat_permissions
  SELECT EXISTS(
    SELECT 1
    FROM role_chat_permissions
    WHERE organization_id = p_organization_id
      AND sender_role_id = v_sender_role_id
      AND recipient_role_id = v_recipient_role_id
  ) INTO v_permission_exists;

  -- If entry exists, messaging is denied
  -- If no entry exists, messaging is allowed (default)
  RETURN NOT v_permission_exists;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | p_sender_id uuid, p_recipient_id uuid, p_organization_id uuid                                                                                                                                         | boolean                                                                                                                                                                                                                                                                                                                               | plpgsql  | STABLE     | false     | true                |
| public         | check_user_exists_by_email               | FUNCTION     | boolean     | DEFINER       | 
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | p_email text                                                                                                                                                                                          | boolean                                                                                                                                                                                                                                                                                                                               | plpgsql  | VOLATILE   | false     | true                |
| public         | count_admins_in_organization             | FUNCTION     | integer     | DEFINER       | 
DECLARE
    v_admin_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_admin_count
    FROM public.organization_members om
    INNER JOIN public.organization_roles or_role ON or_role.id = om.organization_role_id
    WHERE om.organization_id = p_organization_id
      AND or_role.name = 'admin';
    
    RETURN COALESCE(v_admin_count, 0);
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | p_organization_id uuid                                                                                                                                                                                | integer                                                                                                                                                                                                                                                                                                                               | plpgsql  | VOLATILE   | false     | true                |
| public         | count_members_in_organization            | FUNCTION     | integer     | DEFINER       | 
DECLARE
    v_member_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_member_count
    FROM public.organization_members
    WHERE organization_id = p_organization_id;
    
    RETURN COALESCE(v_member_count, 0);
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | p_organization_id uuid                                                                                                                                                                                | integer                                                                                                                                                                                                                                                                                                                               | plpgsql  | VOLATILE   | false     | true                |
| public         | create_general_invite_link               | FUNCTION     | record      | DEFINER       | 
DECLARE
    v_link_id UUID;
BEGIN
    -- Validate organization exists
    IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE organizations.id = p_organization_id) THEN
        RAISE EXCEPTION 'La organización no existe.'
        USING ERRCODE = 'P0001';
    END IF;

    -- Validate role exists
    IF NOT EXISTS (SELECT 1 FROM public.organization_roles WHERE organization_roles.id = p_organization_role_id) THEN
        RAISE EXCEPTION 'El rol de organización especificado no existe.'
        USING ERRCODE = 'P0002';
    END IF;

    -- Check if token already exists
    IF EXISTS (SELECT 1 FROM public.general_invite_links WHERE general_invite_links.token = p_token) THEN
        RAISE EXCEPTION 'El token ya existe. Por favor, genera uno nuevo.'
        USING ERRCODE = '23505';
    END IF;

    -- Create the general invite link
    -- Use a table alias and fully qualify the RETURNING clause
    INSERT INTO public.general_invite_links AS gil (
        organization_id,
        organization_role_id,
        token,
        requires_approval,
        expires_at,
        created_by
    )
    VALUES (
        p_organization_id,
        p_organization_role_id,
        p_token,
        p_requires_approval,
        p_expires_at,
        p_created_by
    )
    RETURNING gil.id INTO v_link_id;

    -- Return the created link
    -- Explicitly qualify all column references to avoid ambiguity
    RETURN QUERY
    SELECT
        gil.id AS id,
        gil.organization_id AS organization_id,
        gil.organization_role_id AS organization_role_id,
        gil.token AS token,
        gil.requires_approval AS requires_approval,
        gil.expires_at AS expires_at,
        gil.created_by AS created_by,
        gil.created_at AS created_at,
        gil.updated_at AS updated_at
    FROM public.general_invite_links gil
    WHERE gil.id = v_link_id;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | p_organization_id uuid, p_organization_role_id integer, p_token text, p_requires_approval boolean, p_expires_at timestamp with time zone, p_created_by uuid                                           | TABLE(id uuid, organization_id uuid, organization_role_id integer, token text, requires_approval boolean, expires_at timestamp with time zone, created_by uuid, created_at timestamp with time zone, updated_at timestamp with time zone)                                                                                             | plpgsql  | VOLATILE   | false     | true                |
| public         | create_invitation_from_general_link      | FUNCTION     | record      | DEFINER       | 
DECLARE
    v_invitation_id UUID;
    v_existing_invitation UUID;
    v_link RECORD;
BEGIN
    -- Get general invite link details
    SELECT 
        gil.id,
        gil.organization_id,
        gil.organization_role_id,
        gil.created_by,
        gil.requires_approval,
        gil.expires_at AS link_expires_at
    INTO v_link
    FROM public.general_invite_links gil
    WHERE gil.id = p_general_invite_link_id;

    -- Validate general invite link exists
    IF v_link.id IS NULL THEN
        RAISE EXCEPTION 'El enlace de invitación general no existe.'
        USING ERRCODE = 'P0001';
    END IF;

    -- Check if link is expired
    IF v_link.link_expires_at IS NOT NULL AND v_link.link_expires_at < NOW() THEN
        RAISE EXCEPTION 'Este enlace de invitación ha expirado.'
        USING ERRCODE = 'P0002';
    END IF;

    -- Check for duplicate pending invitations (including pending_approval)
    SELECT oi.id INTO v_existing_invitation
    FROM public.organization_invitations oi
    WHERE oi.organization_id = v_link.organization_id
      AND oi.email = LOWER(TRIM(p_email))
      AND oi.status IN ('pending', 'pending_approval')
    LIMIT 1;

    IF v_existing_invitation IS NOT NULL THEN
        RAISE EXCEPTION 'Ya existe una invitación pendiente para este email en esta organización.'
        USING ERRCODE = '23505';
    END IF;

    -- Validate status
    IF p_status NOT IN ('pending', 'pending_approval') THEN
        RAISE EXCEPTION 'El estado de la invitación debe ser "pending" o "pending_approval".'
        USING ERRCODE = 'P0003';
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
        general_invite_link_id,
        user_id
    )
    VALUES (
        v_link.organization_id,
        LOWER(TRIM(p_email)),
        p_token,
        v_link.organization_role_id,
        v_link.created_by,
        p_status::invitation_status,
        p_expires_at,
        TRIM(p_first_name),
        TRIM(p_last_name),
        p_general_invite_link_id,
        p_user_id
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
        oi.general_invite_link_id,
        oi.user_id,
        oi.created_at,
        oi.updated_at
    FROM public.organization_invitations oi
    WHERE oi.id = v_invitation_id;
END;
 | p_general_invite_link_id uuid, p_email text, p_token text, p_first_name text, p_last_name text, p_expires_at timestamp with time zone, p_status text, p_user_id uuid                                  | TABLE(id uuid, organization_id uuid, email text, token text, organization_role_id integer, invited_by uuid, status text, expires_at timestamp with time zone, first_name text, last_name text, description text, general_invite_link_id uuid, user_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone) | plpgsql  | VOLATILE   | false     | true                |
| public         | create_invitation_from_general_link      | FUNCTION     | record      | DEFINER       | 
DECLARE
    v_invitation_id UUID;
    v_existing_invitation UUID;
    v_link RECORD;
BEGIN
    -- Get general invite link details
    SELECT 
        gil.id,
        gil.organization_id,
        gil.organization_role_id,
        gil.created_by,
        gil.requires_approval,
        gil.expires_at AS link_expires_at
    INTO v_link
    FROM public.general_invite_links gil
    WHERE gil.id = p_general_invite_link_id;

    -- Validate general invite link exists
    IF v_link.id IS NULL THEN
        RAISE EXCEPTION 'El enlace de invitación general no existe.'
        USING ERRCODE = 'P0001';
    END IF;

    -- Check if link is expired
    IF v_link.link_expires_at IS NOT NULL AND v_link.link_expires_at < NOW() THEN
        RAISE EXCEPTION 'Este enlace de invitación ha expirado.'
        USING ERRCODE = 'P0002';
    END IF;

    -- Check for duplicate pending invitations (including pending_approval)
    SELECT oi.id INTO v_existing_invitation
    FROM public.organization_invitations oi
    WHERE oi.organization_id = v_link.organization_id
      AND oi.email = LOWER(TRIM(p_email))
      AND oi.status IN ('pending', 'pending_approval')
    LIMIT 1;

    IF v_existing_invitation IS NOT NULL THEN
        RAISE EXCEPTION 'Ya existe una invitación pendiente para este email en esta organización.'
        USING ERRCODE = '23505';
    END IF;

    -- Validate status
    IF p_status NOT IN ('pending', 'pending_approval') THEN
        RAISE EXCEPTION 'El estado de la invitación debe ser "pending" o "pending_approval".'
        USING ERRCODE = 'P0003';
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
        general_invite_link_id
    )
    VALUES (
        v_link.organization_id,
        LOWER(TRIM(p_email)),
        p_token,
        v_link.organization_role_id,
        v_link.created_by,
        p_status::invitation_status,
        p_expires_at,
        TRIM(p_first_name),
        TRIM(p_last_name),
        p_general_invite_link_id
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
        oi.general_invite_link_id,
        oi.created_at,
        oi.updated_at
    FROM public.organization_invitations oi
    WHERE oi.id = v_invitation_id;
END;
                                                            | p_general_invite_link_id uuid, p_email text, p_token text, p_first_name text, p_last_name text, p_expires_at timestamp with time zone, p_status text                                                  | TABLE(id uuid, organization_id uuid, email text, token text, organization_role_id integer, invited_by uuid, status text, expires_at timestamp with time zone, first_name text, last_name text, description text, general_invite_link_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone)               | plpgsql  | VOLATILE   | false     | true                |
| public         | create_organization_chat_settings        | FUNCTION     | trigger     | DEFINER       | 
BEGIN
  INSERT INTO organization_chat_settings (organization_id)
  VALUES (NEW.id)
  ON CONFLICT (organization_id) DO NOTHING;
  RETURN NEW;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |                                                                                                                                                                                                       | trigger                                                                                                                                                                                                                                                                                                                               | plpgsql  | VOLATILE   | false     | true                |
| public         | create_organization_invitation           | FUNCTION     | record      | DEFINER       | 
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | p_organization_id uuid, p_email text, p_token text, p_organization_role_id integer, p_invited_by uuid, p_expires_at timestamp with time zone, p_first_name text, p_last_name text, p_description text | TABLE(id uuid, organization_id uuid, email text, token text, organization_role_id integer, invited_by uuid, status text, expires_at timestamp with time zone, first_name text, last_name text, description text, created_at timestamp with time zone, updated_at timestamp with time zone)                                            | plpgsql  | VOLATILE   | false     | true                |
| public         | create_organization_with_admin           | FUNCTION     | record      | DEFINER       | 
DECLARE
  new_org_id UUID;
  admin_role_id INT4;
  new_member_id UUID;
  final_type_id INTEGER;
BEGIN
  -- Determine organization type ID
  -- If provided, use it; otherwise default to residential
  IF p_organization_type_id IS NOT NULL THEN
    final_type_id := p_organization_type_id;
  ELSE
    -- Default to residential type
    SELECT id INTO final_type_id
    FROM public.organization_types
    WHERE name = 'residential'
    LIMIT 1;
  END IF;

  -- Validate organization type exists
  IF final_type_id IS NULL THEN
    RAISE EXCEPTION 'Organization type not found';
  END IF;

  -- Get admin role ID for the specified organization type
  SELECT id INTO admin_role_id
  FROM public.organization_roles
  WHERE name = 'admin'
    AND organization_type_id = final_type_id
  LIMIT 1;

  IF admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Admin role not found for the specified organization type';
  END IF;

  -- Create organization with organization_type_id
  INSERT INTO public.organizations (name, created_by, organization_type_id)
  VALUES (org_name, creator_user_id, final_type_id)
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | org_name text, creator_user_id uuid, p_organization_type_id integer                                                                                                                                   | TABLE(organization_id uuid, organization_name text, created_by uuid, created_at timestamp with time zone, member_id uuid, member_role_id integer, member_role_name text)                                                                                                                                                              | plpgsql  | VOLATILE   | false     | true                |
| public         | create_organization_with_admin           | FUNCTION     | record      | DEFINER       | 
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | org_name text, creator_user_id uuid                                                                                                                                                                   | TABLE(organization_id uuid, organization_name text, created_by uuid, created_at timestamp with time zone, member_id uuid, member_role_id integer, member_role_name text)                                                                                                                                                              | plpgsql  | VOLATILE   | false     | true                |
| public         | create_user_profile                      | FUNCTION     | void        | DEFINER       | 
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | p_user_id uuid, p_first_name text, p_last_name text, p_date_of_birth date, p_role_id uuid                                                                                                             | void                                                                                                                                                                                                                                                                                                                                  | plpgsql  | VOLATILE   | false     | true                |
| public         | get_general_invite_link_by_token         | FUNCTION     | record      | DEFINER       | 
BEGIN
    RETURN QUERY
    SELECT
        gil.id,
        gil.organization_id,
        o.name AS organization_name,
        gil.organization_role_id,
        or_role.name AS role_name,
        or_role.description AS role_description,
        gil.token,
        gil.requires_approval,
        gil.expires_at,
        gil.created_by,
        gil.created_at,
        gil.updated_at,
        CASE 
            WHEN gil.expires_at IS NOT NULL AND gil.expires_at < NOW() THEN true
            ELSE false
        END AS is_expired
    FROM public.general_invite_links gil
    INNER JOIN public.organizations o ON o.id = gil.organization_id
    INNER JOIN public.organization_roles or_role ON or_role.id = gil.organization_role_id
    WHERE gil.token = p_token;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | p_token text                                                                                                                                                                                          | TABLE(id uuid, organization_id uuid, organization_name text, organization_role_id integer, role_name text, role_description text, token text, requires_approval boolean, expires_at timestamp with time zone, created_by uuid, created_at timestamp with time zone, updated_at timestamp with time zone, is_expired boolean)          | plpgsql  | VOLATILE   | false     | true                |
| public         | get_invitation_by_token                  | FUNCTION     | record      | DEFINER       | 
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | p_token text                                                                                                                                                                                          | TABLE(id uuid, email text, first_name text, last_name text, description text, status text, expires_at timestamp with time zone, created_at timestamp with time zone, organization_id uuid, organization_role_id integer, invited_by uuid, organization_name text, role_id integer, role_name text, role_description text)             | plpgsql  | VOLATILE   | false     | true                |
| public         | get_or_create_conversation               | FUNCTION     | uuid        | DEFINER       | 
DECLARE
  v_conversation_id UUID;
  v_smaller_user_id UUID;
  v_larger_user_id UUID;
BEGIN
  -- Ensure consistent ordering (user1_id < user2_id)
  IF p_user1_id < p_user2_id THEN
    v_smaller_user_id := p_user1_id;
    v_larger_user_id := p_user2_id;
  ELSE
    v_smaller_user_id := p_user2_id;
    v_larger_user_id := p_user1_id;
  END IF;

  -- Try to get existing conversation
  SELECT id INTO v_conversation_id
  FROM chat_conversations
  WHERE organization_id = p_organization_id
    AND user1_id = v_smaller_user_id
    AND user2_id = v_larger_user_id
  LIMIT 1;

  -- If not found, create new one
  IF v_conversation_id IS NULL THEN
    INSERT INTO chat_conversations (organization_id, user1_id, user2_id)
    VALUES (p_organization_id, v_smaller_user_id, v_larger_user_id)
    ON CONFLICT (organization_id, user1_id, user2_id) DO NOTHING
    RETURNING id INTO v_conversation_id;

    -- If still null (due to race condition), get the existing one
    IF v_conversation_id IS NULL THEN
      SELECT id INTO v_conversation_id
      FROM chat_conversations
      WHERE organization_id = p_organization_id
        AND user1_id = v_smaller_user_id
        AND user2_id = v_larger_user_id
      LIMIT 1;
    END IF;
  END IF;

  RETURN v_conversation_id;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | p_user1_id uuid, p_user2_id uuid, p_organization_id uuid                                                                                                                                              | uuid                                                                                                                                                                                                                                                                                                                                  | plpgsql  | VOLATILE   | false     | true                |
| public         | get_user_conversations_with_metadata     | FUNCTION     | record      | DEFINER       | 
BEGIN
  RETURN QUERY
  WITH user_conversations AS (
    SELECT 
      cc.id AS conv_id,
      CASE 
        WHEN cc.user1_id = p_user_id THEN cc.user2_id
        ELSE cc.user1_id
      END AS other_user
    FROM chat_conversations cc
    WHERE cc.organization_id = p_organization_id
      AND (cc.user1_id = p_user_id OR cc.user2_id = p_user_id)
  ),
  conversation_metadata AS (
    SELECT
      uc.conv_id,
      uc.other_user,
      cm.content AS last_msg_content,
      cm.created_at AS last_msg_at,
      cm.sender_id AS last_msg_sender_id,
      COUNT(CASE WHEN cm2.is_read = false AND cm2.recipient_id = p_user_id THEN 1 END) AS unread
    FROM user_conversations uc
    LEFT JOIN LATERAL (
      SELECT content, created_at, sender_id
      FROM chat_messages
      WHERE chat_messages.conversation_id = uc.conv_id
      ORDER BY created_at DESC
      LIMIT 1
    ) cm ON true
    LEFT JOIN chat_messages cm2 ON cm2.conversation_id = uc.conv_id
    GROUP BY uc.conv_id, uc.other_user, cm.content, cm.created_at, cm.sender_id
  )
  SELECT
    cm.conv_id,
    cm.other_user,
    COALESCE(get_user_name(cm.other_user), '') AS other_user_name,
    cm.last_msg_content,
    COALESCE(cm.last_msg_at, (SELECT created_at FROM chat_conversations WHERE id = cm.conv_id)) AS last_msg_at,
    COALESCE(cm.unread, 0) AS unread_count,
    cm.last_msg_sender_id
  FROM conversation_metadata cm
  ORDER BY cm.last_msg_at DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | p_user_id uuid, p_organization_id uuid, p_limit integer, p_offset integer                                                                                                                             | TABLE(conversation_id uuid, other_user_id uuid, other_user_name text, last_message_content text, last_message_at timestamp with time zone, unread_count bigint, last_message_sender_id uuid)                                                                                                                                          | plpgsql  | STABLE     | false     | true                |
| public         | get_user_flags                           | FUNCTION     | record      | DEFINER       | 
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | p_user_id uuid                                                                                                                                                                                        | TABLE(id uuid, name text, description text, enabled boolean)                                                                                                                                                                                                                                                                          | plpgsql  | VOLATILE   | false     | true                |
| public         | get_user_name                            | FUNCTION     | text        | DEFINER       | 
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | p_user_id uuid                                                                                                                                                                                        | text                                                                                                                                                                                                                                                                                                                                  | plpgsql  | STABLE     | false     | true                |
| public         | handle_new_user                          | FUNCTION     | trigger     | DEFINER       | 
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |                                                                                                                                                                                                       | trigger                                                                                                                                                                                                                                                                                                                               | plpgsql  | VOLATILE   | false     | true                |
| public         | is_app_admin                             | FUNCTION     | boolean     | DEFINER       | 
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | p_user_id uuid                                                                                                                                                                                        | boolean                                                                                                                                                                                                                                                                                                                               | plpgsql  | VOLATILE   | false     | true                |
| public         | is_last_admin_in_organization            | FUNCTION     | boolean     | DEFINER       | 
DECLARE
    v_member_role_name TEXT;
    v_admin_count INTEGER;
BEGIN
    -- Get the member's current role name
    SELECT or_role.name
    INTO v_member_role_name
    FROM public.organization_members om
    INNER JOIN public.organization_roles or_role ON or_role.id = om.organization_role_id
    WHERE om.id = p_member_id
      AND om.organization_id = p_organization_id;
    
    -- If member is not an admin, they can't be the last admin
    IF v_member_role_name != 'admin' THEN
        RETURN false;
    END IF;
    
    -- Count total admins in the organization
    v_admin_count := public.count_admins_in_organization(p_organization_id);
    
    -- If there's only 1 admin, and this member is that admin, return true
    RETURN v_admin_count = 1;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | p_member_id uuid, p_organization_id uuid                                                                                                                                                              | boolean                                                                                                                                                                                                                                                                                                                               | plpgsql  | VOLATILE   | false     | true                |
| public         | is_qr_code_valid_for_date                | FUNCTION     | boolean     | DEFINER       | 
DECLARE
    v_qr_code RECORD;
    v_is_valid BOOLEAN := false;
    v_day_of_week INTEGER;
    v_day_of_month INTEGER;
    v_days_of_week INTEGER[];
    v_custom_dates DATE[];
BEGIN
    -- Get QR code details
    SELECT 
        recurrence_type,
        recurrence_config,
        valid_from,
        valid_until,
        status,
        max_uses,
        use_count
    INTO v_qr_code
    FROM public.qr_codes
    WHERE id = p_qr_code_id;

    -- Check if QR code exists
    IF v_qr_code IS NULL THEN
        RETURN false;
    END IF;

    -- Check if status is active
    IF v_qr_code.status != 'active' THEN
        RETURN false;
    END IF;

    -- Check date range
    IF p_check_date < DATE(v_qr_code.valid_from) OR 
       (v_qr_code.valid_until IS NOT NULL AND p_check_date > DATE(v_qr_code.valid_until)) THEN
        RETURN false;
    END IF;

    -- Check max uses
    IF v_qr_code.max_uses IS NOT NULL AND v_qr_code.use_count >= v_qr_code.max_uses THEN
        RETURN false;
    END IF;

    -- Check recurrence pattern
    CASE v_qr_code.recurrence_type
        WHEN 'none' THEN
            -- Single use: check if date matches valid_from
            v_is_valid := (DATE(v_qr_code.valid_from) = p_check_date);
        
        WHEN 'daily' THEN
            -- Valid every day in range
            v_is_valid := true;
        
        WHEN 'weekly' THEN
            -- Check if day of week matches
            v_day_of_week := EXTRACT(DOW FROM p_check_date); -- 0=Sunday, 6=Saturday
            v_days_of_week := ARRAY(SELECT jsonb_array_elements_text(v_qr_code.recurrence_config->'daysOfWeek'));
            v_is_valid := v_day_of_week::TEXT = ANY(v_days_of_week);
        
        WHEN 'monthly' THEN
            -- Check if day of month matches
            v_day_of_month := EXTRACT(DAY FROM p_check_date);
            v_is_valid := (v_qr_code.recurrence_config->>'dayOfMonth')::INTEGER = v_day_of_month;
        
        WHEN 'custom' THEN
            -- Check if date is in custom dates array
            v_custom_dates := ARRAY(
                SELECT (jsonb_array_elements_text(v_qr_code.recurrence_config->'dates'))::DATE
            );
            v_is_valid := p_check_date = ANY(v_custom_dates);
        
        ELSE
            v_is_valid := false;
    END CASE;

    RETURN v_is_valid;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | p_qr_code_id uuid, p_check_date date                                                                                                                                                                  | boolean                                                                                                                                                                                                                                                                                                                               | plpgsql  | VOLATILE   | false     | true                |
| public         | is_user_organization_member              | FUNCTION     | boolean     | DEFINER       | 
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.organization_members
        WHERE user_id = p_user_id
        AND organization_id = p_organization_id
    );
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | p_user_id uuid, p_organization_id uuid                                                                                                                                                                | boolean                                                                                                                                                                                                                                                                                                                               | plpgsql  | STABLE     | false     | true                |
| public         | prevent_last_admin_delete                | FUNCTION     | trigger     | DEFINER       | 
DECLARE
    v_admin_count INTEGER;
    v_member_count INTEGER;
BEGIN
    -- Check if the member being deleted is an admin
    IF EXISTS (
        SELECT 1
        FROM organization_roles
        WHERE id = OLD.organization_role_id
        AND name = 'admin'
    ) THEN
        -- Count admins in the organization (excluding the one being deleted)
        SELECT COUNT(*) INTO v_admin_count
        FROM organization_members om
        INNER JOIN organization_roles orole ON orole.id = om.organization_role_id
        WHERE om.organization_id = OLD.organization_id
        AND om.id != OLD.id
        AND orole.name = 'admin';
        
        -- Count total members in the organization (excluding the one being deleted)
        SELECT COUNT(*) INTO v_member_count
        FROM organization_members om
        WHERE om.organization_id = OLD.organization_id
        AND om.id != OLD.id;
        
        -- Allow deletion if:
        -- 1. There are other admins (v_admin_count > 0), OR
        -- 2. This is the only member in the organization (v_member_count = 0)
        --    This allows organization deletion to cascade delete the last admin
        IF v_admin_count = 0 AND v_member_count > 0 THEN
            RAISE EXCEPTION 'No se puede eliminar el último administrador. Debe haber al menos un administrador en la organización.'
                USING ERRCODE = '23505';
        END IF;
    END IF;
    
    RETURN OLD;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |                                                                                                                                                                                                       | trigger                                                                                                                                                                                                                                                                                                                               | plpgsql  | VOLATILE   | false     | true                |
| public         | prevent_last_admin_role_change           | FUNCTION     | trigger     | DEFINER       | 
DECLARE
    v_old_role_name TEXT;
    v_new_role_name TEXT;
    v_is_last_admin BOOLEAN;
BEGIN
    -- Get old role name
    SELECT or_role.name
    INTO v_old_role_name
    FROM public.organization_roles or_role
    WHERE or_role.id = OLD.organization_role_id;
    
    -- Get new role name
    SELECT or_role.name
    INTO v_new_role_name
    FROM public.organization_roles or_role
    WHERE or_role.id = NEW.organization_role_id;
    
    -- Only check if changing FROM admin TO non-admin
    IF v_old_role_name = 'admin' AND v_new_role_name != 'admin' THEN
        -- Check if this member is the last admin
        v_is_last_admin := public.is_last_admin_in_organization(OLD.id, OLD.organization_id);
        
        IF v_is_last_admin THEN
            RAISE EXCEPTION 'No se puede cambiar el rol del último administrador. Debe haber al menos un administrador en la organización.'
                USING ERRCODE = '23505';
        END IF;
    END IF;
    
    RETURN NEW;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |                                                                                                                                                                                                       | trigger                                                                                                                                                                                                                                                                                                                               | plpgsql  | VOLATILE   | false     | true                |
| public         | prevent_organization_delete_with_members | FUNCTION     | trigger     | DEFINER       | 
DECLARE
    v_member_count INTEGER;
BEGIN
    -- Count members in the organization
    v_member_count := public.count_members_in_organization(OLD.id);
    
    -- Allow deletion if there are 0 members (already empty)
    -- Allow deletion if there's exactly 1 member (user can delete their own organization)
    -- Prevent deletion if there are 2+ members (must remove members first)
    IF v_member_count > 1 THEN
        RAISE EXCEPTION 'No se puede eliminar una organización que tiene miembros. Elimina todos los miembros primero.'
            USING ERRCODE = '23505';
    END IF;
    
    RETURN OLD;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |                                                                                                                                                                                                       | trigger                                                                                                                                                                                                                                                                                                                               | plpgsql  | VOLATILE   | false     | true                |
| public         | set_default_role_id                      | FUNCTION     | trigger     | DEFINER       | 
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |                                                                                                                                                                                                       | trigger                                                                                                                                                                                                                                                                                                                               | plpgsql  | VOLATILE   | false     | true                |
| public         | update_chat_updated_at                   | FUNCTION     | trigger     | INVOKER       | 
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |                                                                                                                                                                                                       | trigger                                                                                                                                                                                                                                                                                                                               | plpgsql  | VOLATILE   | false     | false               |
| public         | update_conversation_last_message_at      | FUNCTION     | trigger     | INVOKER       | 
BEGIN
  UPDATE chat_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |                                                                                                                                                                                                       | trigger                                                                                                                                                                                                                                                                                                                               | plpgsql  | VOLATILE   | false     | false               |
| public         | update_general_invite_links_updated_at   | FUNCTION     | trigger     | INVOKER       | 
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |                                                                                                                                                                                                       | trigger                                                                                                                                                                                                                                                                                                                               | plpgsql  | VOLATILE   | false     | false               |
| public         | update_organization_types_updated_at     | FUNCTION     | trigger     | INVOKER       | 
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |                                                                                                                                                                                                       | trigger                                                                                                                                                                                                                                                                                                                               | plpgsql  | VOLATILE   | false     | false               |
| public         | update_updated_at_column                 | FUNCTION     | trigger     | INVOKER       | 
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |                                                                                                                                                                                                       | trigger                                                                                                                                                                                                                                                                                                                               | plpgsql  | VOLATILE   | false     | false               |
| public         | update_updated_at_column                 | FUNCTION     | trigger     | INVOKER       | 
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |                                                                                                                                                                                                       | trigger                                                                                                                                                                                                                                                                                                                               | plpgsql  | VOLATILE   | false     | false               |
