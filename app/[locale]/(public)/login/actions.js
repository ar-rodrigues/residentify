"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { createClient } from "@/utils/supabase/server";
import { getErrorMessages } from "@/utils/i18n/errorMessages";

export async function login(formData) {
  const supabase = await createClient();
  
  // Get locale from headers or default to "es"
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "";
  const locale = acceptLanguage.startsWith("pt") ? "pt" : "es";
  const { getLoginErrorMessage } = await getErrorMessages(locale);

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    // Return error object instead of throwing
    // This allows the client to handle the error gracefully
    return {
      error: true,
      message: getLoginErrorMessage(error.message),
    };
  }

  revalidatePath("/", "layout");
  redirect("/organizations");
}

export async function signup(formData) {
  const supabase = await createClient();
  
  // Get locale from headers or default to "es"
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "";
  const locale = acceptLanguage.startsWith("pt") ? "pt" : "es";
  const { getSignupErrorMessage } = await getErrorMessages(locale);

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
    options: {
      emailRedirectTo: `/auth/confirm?next=/organizations`,
    },
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    // Return error object instead of throwing
    // This allows the client to handle the error gracefully
    return {
      error: true,
      message: getSignupErrorMessage(error.message),
    };
  }

  // For signup, we might want to show a success message
  // and redirect to a confirmation page or back to login
  revalidatePath("/", "layout");

  // Redirect to login with success message
  redirect("/login?message=signup_success");
}
