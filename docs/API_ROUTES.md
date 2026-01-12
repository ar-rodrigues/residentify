# API Routes Inventory

> **Generated on:** 2026-01-12T20:51:24.822Z
> 
> **To regenerate:** `npm run scan-routes` (add script to package.json)

## Summary Statistics

- **Total Routes:** 45
- **Total HTTP Methods:** 64
- **Fully Documented Routes:** 45 (100%)
- **Partially Documented Routes:** 0
- **Not Documented Routes:** 0
- **Documented Methods:** 64 (100%)
- **Pending Documentation:** 0 methods

## Legend

- ✅ **Fully Documented** - All methods have swagger-jsdoc annotations
- ⚠️ **Partially Documented** - Some methods have swagger-jsdoc annotations
- ❌ **Not Documented** - No swagger-jsdoc annotations found

---

## Access-logs

### ✅ `/api/access-logs`

**File:** `app\api\access-logs\route.js`

**Methods:** GET

- ✅ Documented: GET

## Admin

### ✅ `/api/admin/feature-flags`

**File:** `app\api\admin\feature-flags\route.js`

**Methods:** GET, POST

- ✅ Documented: GET, POST

### ✅ `/api/admin/feature-flags/{id}`

**File:** `app\api\admin\feature-flags\[id]\route.js`

**Methods:** GET, PUT, DELETE

- ✅ Documented: GET, PUT, DELETE

### ✅ `/api/admin/user-flags`

**File:** `app\api\admin\user-flags\route.js`

**Methods:** GET, POST

- ✅ Documented: GET, POST

### ✅ `/api/admin/user-flags/{id}`

**File:** `app\api\admin\user-flags\[id]\route.js`

**Methods:** GET, PUT, DELETE

- ✅ Documented: GET, PUT, DELETE

## General-invite-links

### ✅ `/api/general-invite-links/{token}`

**File:** `app\api\general-invite-links\[token]\route.js`

**Methods:** GET

- ✅ Documented: GET

### ✅ `/api/general-invite-links/{token}/accept`

**File:** `app\api\general-invite-links\[token]\accept\route.js`

**Methods:** POST

- ✅ Documented: POST

### ✅ `/api/general-invite-links/{token}/accept-logged-in`

**File:** `app\api\general-invite-links\[token]\accept-logged-in\route.js`

**Methods:** POST

- ✅ Documented: POST

### ✅ `/api/general-invite-links/{token}/check-status`

**File:** `app\api\general-invite-links\[token]\check-status\route.js`

**Methods:** GET

- ✅ Documented: GET

## Invitations

### ✅ `/api/invitations/{token}`

**File:** `app\api\invitations\[token]\route.js`

**Methods:** GET

- ✅ Documented: GET

### ✅ `/api/invitations/{token}/accept`

**File:** `app\api\invitations\[token]\accept\route.js`

**Methods:** POST

- ✅ Documented: POST

### ✅ `/api/invitations/{token}/accept-logged-in`

**File:** `app\api\invitations\[token]\accept-logged-in\route.js`

**Methods:** POST

- ✅ Documented: POST

### ✅ `/api/invitations/{token}/check-email`

**File:** `app\api\invitations\[token]\check-email\route.js`

**Methods:** GET

- ✅ Documented: GET

## Notifications

### ✅ `/api/notifications`

**File:** `app\api\notifications\route.js`

**Methods:** GET, POST

- ✅ Documented: GET, POST

### ✅ `/api/notifications/{id}/read`

**File:** `app\api\notifications\[id]\read\route.js`

**Methods:** POST

- ✅ Documented: POST

## Organization-roles

### ✅ `/api/organization-roles`

**File:** `app\api\organization-roles\route.js`

**Methods:** GET

- ✅ Documented: GET

## Organization-types

### ✅ `/api/organization-types`

**File:** `app\api\organization-types\route.js`

**Methods:** GET

- ✅ Documented: GET

## Organizations

### ✅ `/api/organizations`

**File:** `app\api\organizations\route.js`

**Methods:** POST

- ✅ Documented: POST

### ✅ `/api/organizations/{id}`

**File:** `app\api\organizations\[id]\route.js`

**Methods:** GET, PUT, DELETE

- ✅ Documented: GET, PUT, DELETE

### ✅ `/api/organizations/{id}/chat/conversations`

**File:** `app\api\organizations\[id]\chat\conversations\route.js`

**Methods:** GET

- ✅ Documented: GET

### ✅ `/api/organizations/{id}/chat/conversations/{conversationId}/archive`

**File:** `app\api\organizations\[id]\chat\conversations\[conversationId]\archive\route.js`

**Methods:** POST

- ✅ Documented: POST

### ✅ `/api/organizations/{id}/chat/conversations/{conversationId}/read`

**File:** `app\api\organizations\[id]\chat\conversations\[conversationId]\read\route.js`

**Methods:** PUT

- ✅ Documented: PUT

### ✅ `/api/organizations/{id}/chat/members`

**File:** `app\api\organizations\[id]\chat\members\route.js`

**Methods:** GET

- ✅ Documented: GET

### ✅ `/api/organizations/{id}/chat/messages`

**File:** `app\api\organizations\[id]\chat\messages\route.js`

**Methods:** POST

- ✅ Documented: POST

### ✅ `/api/organizations/{id}/chat/messages/{messageId}/read`

**File:** `app\api\organizations\[id]\chat\messages\[messageId]\read\route.js`

**Methods:** PUT

- ✅ Documented: PUT

### ✅ `/api/organizations/{id}/chat/permissions`

**File:** `app\api\organizations\[id]\chat\permissions\route.js`

**Methods:** GET, PUT

- ✅ Documented: GET, PUT

### ✅ `/api/organizations/{id}/chat/permissions/check`

**File:** `app\api\organizations\[id]\chat\permissions\check\route.js`

**Methods:** GET

- ✅ Documented: GET

### ✅ `/api/organizations/{id}/chat/role-conversations`

**File:** `app\api\organizations\[id]\chat\role-conversations\route.js`

**Methods:** GET

- ✅ Documented: GET

### ✅ `/api/organizations/{id}/chat/role-conversations/{conversationId}`

**File:** `app\api\organizations\[id]\chat\role-conversations\[conversationId]\route.js`

**Methods:** GET

- ✅ Documented: GET

### ✅ `/api/organizations/{id}/chat/role-permissions`

**File:** `app\api\organizations\[id]\chat\role-permissions\route.js`

**Methods:** GET, PUT

- ✅ Documented: GET, PUT

### ✅ `/api/organizations/{id}/chat/roles`

**File:** `app\api\organizations\[id]\chat\roles\route.js`

**Methods:** GET

- ✅ Documented: GET

### ✅ `/api/organizations/{id}/general-invite-links`

**File:** `app\api\organizations\[id]\general-invite-links\route.js`

**Methods:** GET, POST

- ✅ Documented: GET, POST

### ✅ `/api/organizations/{id}/general-invite-links/{linkId}`

**File:** `app\api\organizations\[id]\general-invite-links\[linkId]\route.js`

**Methods:** DELETE

- ✅ Documented: DELETE

### ✅ `/api/organizations/{id}/invitations`

**File:** `app\api\organizations\[id]\invitations\route.js`

**Methods:** POST

- ✅ Documented: POST

### ✅ `/api/organizations/{id}/invitations/{invitationId}`

**File:** `app\api\organizations\[id]\invitations\[invitationId]\route.js`

**Methods:** DELETE

- ✅ Documented: DELETE

### ✅ `/api/organizations/{id}/invitations/{invitationId}/approve`

**File:** `app\api\organizations\[id]\invitations\[invitationId]\approve\route.js`

**Methods:** POST

- ✅ Documented: POST

### ✅ `/api/organizations/{id}/invitations/{invitationId}/reject`

**File:** `app\api\organizations\[id]\invitations\[invitationId]\reject\route.js`

**Methods:** POST

- ✅ Documented: POST

### ✅ `/api/organizations/{id}/invitations/list`

**File:** `app\api\organizations\[id]\invitations\list\route.js`

**Methods:** GET

- ✅ Documented: GET

### ✅ `/api/organizations/{id}/members`

**File:** `app\api\organizations\[id]\members\route.js`

**Methods:** GET, PUT, DELETE

- ✅ Documented: GET, PUT, DELETE

## Profiles

### ✅ `/api/profiles/main-organization`

**File:** `app\api\profiles\main-organization\route.js`

**Methods:** GET, PUT

- ✅ Documented: GET, PUT

## Qr-codes

### ✅ `/api/qr-codes`

**File:** `app\api\qr-codes\route.js`

**Methods:** GET, POST

- ✅ Documented: GET, POST

### ✅ `/api/qr-codes/{id}`

**File:** `app\api\qr-codes\[id]\route.js`

**Methods:** GET, PUT, DELETE

- ✅ Documented: GET, PUT, DELETE

### ✅ `/api/qr-codes/{id}/access-logs`

**File:** `app\api\qr-codes\[id]\access-logs\route.js`

**Methods:** GET

- ✅ Documented: GET

### ✅ `/api/qr-codes/validate/{token}`

**File:** `app\api\qr-codes\validate\[token]\route.js`

**Methods:** GET, POST

- ✅ Documented: GET, POST

## User

### ✅ `/api/user/flags`

**File:** `app\api\user\flags\route.js`

**Methods:** GET

- ✅ Documented: GET

---

## Notes

- Routes are scanned from `app/api` directory
- Documentation status is based on presence of `@swagger` annotations
- Routes with JSDoc but no `@swagger` annotations are marked as pending
- Dynamic route segments are shown as `{param}` in paths

## Migration Status

This document tracks the migration from custom JSDoc to swagger-jsdoc format.
Routes should be converted incrementally, updating this document as progress is made.

