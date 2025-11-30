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

## React fileList Prop Warning

### Issue Description
When using Ant Design's `Form.Item` with custom file upload components (not using Ant Design's `Upload` component), you may see the following React warning:

```
Warning: React does not recognize the `fileList` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as `filelist` instead. If you accidentally passed it from a parent component, remove it from the DOM element.
```

### Root Cause
The `valuePropName="fileList"` prop in Ant Design's `Form.Item` is specifically designed for use with Ant Design's `Upload` component. When you use a custom file upload implementation (like custom divs with file input handlers) instead of the `Upload` component, React tries to pass the `fileList` prop to the DOM element (Card, div, etc.), which causes the warning.

### Our Implementation
✅ **Fixed** - We manage file uploads manually using `form.setFieldsValue()` instead of relying on `valuePropName`:
- Component: `app/(private)/organizations/[id]/_components/widgets/QRValidationForm.js`
- We removed `valuePropName="fileList"` and `getValueFromEvent` from the Form.Item
- File state is managed manually via `handleFileChange` and `form.setFieldsValue()`

### Status
- **Functionality**: ✅ Working correctly
- **Warning**: ✅ Fixed (no longer appears)

### Resolution
When using custom file upload components with Ant Design forms:
1. **Don't use** `valuePropName="fileList"` unless you're using Ant Design's `Upload` component
2. **Do use** manual form value management with `form.setFieldsValue()` when using custom upload implementations
3. Remove `getValueFromEvent` if you're not using an Upload component

**Action Required**: None - This has been fixed in the codebase.


