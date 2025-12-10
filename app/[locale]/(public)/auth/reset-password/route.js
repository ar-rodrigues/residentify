import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

/**
 * Password Reset Route Handler
 * 
 * Handles password reset token verification from email links.
 * Supports both PKCE flow (modern) and legacy token_hash flow.
 * 
 * KNOWN ISSUE - Supabase Warning:
 * After calling exchangeCodeForSession() or verifyOtp(), you may see a warning:
 * "Using the user object as returned from supabase.auth.getSession() could be insecure!"
 * 
 * This is a KNOWN FALSE POSITIVE from Supabase's internal code. Some internal
 * Supabase methods (like getAuthenticatorAssuranceLevel()) use getSession()
 * internally, which triggers this warning even though we use getUser() correctly.
 * 
 * References:
 * - https://github.com/supabase/auth-js/issues/910
 * - https://github.com/supabase/auth-js/issues/873
 * 
 * Our code is secure - we always use getUser() to verify authentication.
 * This warning does not affect functionality and can be safely ignored.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();

  // Handle PKCE flow (modern - uses 'code' parameter)
  if (code && type === "recovery") {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      // Verify the user after session exchange to ensure authentication
      // This follows Supabase best practices and avoids security warnings
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!userError && user) {
        // User is authenticated, redirect to reset password page
        redirect("/reset-password");
      } else {
        // User verification failed
        redirect("/forgot-password?error=invalid_token");
      }
    } else {
      // If code exchange fails, redirect to error
      redirect("/forgot-password?error=invalid_token");
    }
  }
  // Handle legacy flow (uses 'token_hash' parameter)
  else if (token_hash && type) {
    // Verify the recovery token - this sets the session
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!verifyError) {
      // Verify the user after OTP verification to ensure authentication
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!userError && user) {
        // User is authenticated, redirect to reset password page
        redirect("/reset-password");
      } else {
        // User verification failed
        redirect("/forgot-password?error=invalid_token");
      }
    } else {
      // If verification fails, redirect to error
      redirect("/forgot-password?error=invalid_token");
    }
  } else {
    // No valid parameters, redirect to error
    redirect("/forgot-password?error=invalid_token");
  }
}

