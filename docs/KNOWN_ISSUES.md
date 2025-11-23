# Known Issues

## Supabase Security Warning (False Positive)

### Issue Description
When using password reset functionality, you may see the following warning in the console:

```
Using the user object as returned from supabase.auth.getSession() or from some 
supabase.auth.onAuthStateChange() events could be insecure! This value comes directly 
from the storage medium (usually cookies on the server) and may not be authentic. 
Use supabase.auth.getUser() instead which authenticates the data by contacting 
the Supabase Auth server.
```

### Root Cause
This is a **known false positive** from Supabase's internal code. Some internal Supabase methods (like `getAuthenticatorAssuranceLevel()` or internal code paths within `exchangeCodeForSession()` and `updateUser()`) use `getSession()` internally, which triggers this warning even though our code correctly uses `getUser()`.

### Our Implementation
✅ **Our code is secure** - We always use `getUser()` to verify authentication:
- Route handler: `app/(public)/auth/reset-password/route.js`
- Server actions: `app/(public)/reset-password/actions.js`
- Middleware: `utils/supabase/middleware.js`
- Hooks: `hooks/useUser.js`

### Status
- **Functionality**: ✅ Working correctly
- **Security**: ✅ Secure implementation
- **Warning**: ⚠️ False positive (can be safely ignored)

### References
- [Supabase Auth JS Issue #910](https://github.com/supabase/auth-js/issues/910)
- [Supabase Auth JS Issue #873](https://github.com/supabase/auth-js/issues/873)
- [Supabase Documentation](https://supabase.com/docs/reference/javascript/auth-getsession)

### Resolution
This is a known issue in Supabase's codebase. The Supabase team is aware and working on fixes. Keep your Supabase packages updated, as future releases may resolve this warning.

**Action Required**: None - This warning can be safely ignored. Our implementation follows Supabase's security best practices.


