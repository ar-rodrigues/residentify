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

## Ant Design Deprecated Props

### Issue Description

Ant Design has deprecated several props in favor of new APIs. Using deprecated props will show warnings in the console:

1. **Card component**: `bodyStyle` prop is deprecated

   ```
   Warning: [antd: Card] `bodyStyle` is deprecated. Please use `styles.body` instead.
   ```

2. **Alert component**: `message` prop is deprecated
   ```
   Warning: [antd: Alert] `message` is deprecated. Please use `title` instead.
   ```

### Root Cause

Ant Design v5 introduced a new styling API using the `styles` prop for components, and renamed the `message` prop to `title` in Alert component for better semantic clarity.

### Our Implementation

✅ **Fixed** - We've updated all deprecated props to use the new APIs:

- **Card component**: Replaced `bodyStyle` with `styles.body`

  - Fixed in: `components/organizations/ChatWidget.js`
  - Old: `bodyStyle={{ padding: 0, display: "flex", flexDirection: "column", height: "100%" }}`
  - New: `styles={{ body: { padding: 0, display: "flex", flexDirection: "column", height: "100%" } }}`

- **Alert component**: Replaced `message` with `title`
  - Fixed in: `app/[locale]/(private)/organizations/[id]/_components/widgets/residential/ChatPermissionsSettings.js`
  - Old: `message={t("chat.permissions.noRoles")}`
  - New: `title={t("chat.permissions.noRoles")}`

### Status

- **Functionality**: ✅ Working correctly
- **Warnings**: ✅ Fixed (no longer appear)

### Resolution

When using Ant Design components:

1. **Card component**: Use `styles={{ body: { ... } }}` instead of `bodyStyle={{ ... }}`
2. **Alert component**: Use `title` prop instead of `message` prop
3. Check the [Ant Design Migration Guide](https://ant.design/docs/react/migration-v5) for other deprecated APIs

**Action Required**: None - These have been fixed in the codebase. Always use the latest Ant Design APIs to avoid deprecation warnings.

## Ant Design List Component Deprecation

### Issue Description

Ant Design has deprecated the `List` component and will remove it in the next major version. Using `List` will show the following warning:

```
Warning: [antd: List] The `List` component is deprecated. And will be removed in next major version.
```

### Root Cause

Ant Design v5+ is moving away from the `List` component in favor of more flexible, modern approaches using native HTML elements with Tailwind CSS or Ant Design's `Flex` component. The `List` component is considered too opinionated and doesn't provide enough flexibility for modern UI patterns.

### Our Implementation

✅ **Fixed** - We've replaced all `List` components with native div structures using Tailwind CSS:

- **Component**: `components/organizations/ChatWidget.js`
- **Replaced**: Two `List` components (conversations list and members list)
- **Solution**: Used `div` elements with Tailwind classes for styling:
  - `divide-y divide-gray-200` for item separators
  - `flex items-start gap-3` for item layout
  - `p-4` for padding
  - `hover:bg-gray-50` for hover effects
  - Maintained all original functionality (click handlers, badges, avatars, etc.)

### Status

- **Functionality**: ✅ Working correctly
- **Warning**: ✅ Fixed (no longer appears)
- **Styling**: ✅ Maintains same visual appearance

### Resolution

When replacing deprecated `List` components:

1. **Don't use** `List` or `List.Item` components
2. **Do use** native `div` elements with Tailwind CSS classes
3. **Structure**: Use `div` with `divide-y` for separators, `flex` for layouts
4. **Maintain**: All click handlers, styling, and functionality from the original List

**Example replacement pattern:**

```jsx
// Old (deprecated)
<List
  dataSource={items}
  renderItem={(item) => (
    <List.Item>
      <List.Item.Meta
        avatar={<Avatar />}
        title={<span>Title</span>}
        description={<span>Description</span>}
      />
    </List.Item>
  )}
/>

// New (recommended)
<div className="divide-y divide-gray-200">
  {items.map((item) => (
    <div key={item.id} className="p-4 hover:bg-gray-50">
      <div className="flex items-start gap-3">
        <Avatar />
        <div className="flex-1">
          <div className="font-medium">Title</div>
          <div className="text-sm text-gray-500">Description</div>
        </div>
      </div>
    </div>
  ))}
</div>
```

**Action Required**: None - This has been fixed in the codebase. Always check for deprecated Ant Design components and replace them with modern alternatives.

## Ant Design App Component Hydration Error

### Issue Description

When using Ant Design's `App` component with Next.js 15 SSR, you may see the following hydration error in the console:

```
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
This won't be patched up.

<div
+ className="css-dev-only-do-not-override-3obk1w ant-app css-var-_R_19etb_"
- className="css-dev-only-do-not-override-3obk1w ant-app css-var-_R_55rlb_"
  style={undefined}
>
```

The error shows that the CSS variable class names generated by Ant Design's `App` component differ between server and client rendering (e.g., `css-var-_R_19etb_` vs `css-var-_R_55rlb_`).

### Root Cause

Ant Design's `App` component generates dynamic CSS variable class names internally to manage theme tokens and CSS-in-JS styles. These class names are generated at render time and can differ between server-side rendering (SSR) and client-side hydration, causing React hydration mismatches.

This is a known compatibility issue between Ant Design v5 and Next.js 15's SSR/hydration system, particularly when using the `App` component wrapper.

### Our Implementation

✅ **Fixed** - We use a client-side only mounting pattern to prevent hydration mismatches:

- **Component**: `components/providers/AntdProvider.js`
- **Solution**: Use `useState` and `useEffect` to ensure the `App` component only renders on the client side:
  - On the server and initial render: Render children in a `div` with `suppressHydrationWarning`
  - After client mount: Render children inside the `App` component
  - This prevents the hydration mismatch while maintaining all Ant Design functionality (message, notification, etc.)

### Status

- **Functionality**: ✅ Working correctly
- **Hydration Error**: ✅ Fixed (no longer appears)
- **Ant Design Features**: ✅ All features work correctly (message, notification, modal, etc.)

### Resolution

When using Ant Design's `App` component with Next.js 15:

1. **Use client-side only mounting** for the `App` component to prevent hydration mismatches
2. **Render a fallback** during SSR to maintain layout structure
3. **Use `suppressHydrationWarning`** on the fallback wrapper to suppress any remaining warnings

**Example implementation:**

```jsx
"use client";

import { ConfigProvider, App } from "antd";
import { useState, useEffect } from "react";

export default function AntdProvider({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ConfigProvider theme={{ ... }}>
      {mounted ? (
        <App>{children}</App>
      ) : (
        <div suppressHydrationWarning>{children}</div>
      )}
    </ConfigProvider>
  );
}
```

### References

- [Next.js Hydration Error Documentation](https://nextjs.org/docs/messages/react-hydration-error)
- [React Hydration Mismatch](https://react.dev/reference/react-dom/client/hydrateRoot#handling-different-client-and-server-content)
- [Ant Design App Component](https://ant.design/components/app)

**Action Required**: None - This has been fixed in the codebase. The `App` component is now mounted client-side only to prevent hydration mismatches.
