import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateSession } from "@/utils/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request) {
  // First, handle Supabase session update (this may redirect)
  const supabaseResponse = await updateSession(request);
  
  // If Supabase redirects (e.g., to login), return that response
  if (supabaseResponse && supabaseResponse.status === 307) {
    // Check if the redirect path needs locale prefix
    const url = new URL(supabaseResponse.headers.get("location") || request.url);
    const pathname = url.pathname;
    
    // If pathname doesn't start with a locale, add it
    const locale = request.headers.get("x-next-intl-locale") || 
                   request.nextUrl.pathname.split("/")[1] ||
                   routing.defaultLocale;
    
    if (!routing.locales.includes(pathname.split("/")[1])) {
      // Add locale prefix if not present
      url.pathname = `/${locale}${pathname}`;
      supabaseResponse.headers.set("location", url.toString());
    }
    
    return supabaseResponse;
  }

  // Then, handle locale routing with next-intl
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes don't need locale)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*.js|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
