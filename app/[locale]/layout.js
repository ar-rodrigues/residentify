import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Inter } from "next/font/google";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import AntdProvider from "@/components/providers/AntdProvider";
import "../globals.css";
import "antd/dist/reset.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Supabase DNS prefetch - actual URL comes from NEXT_PUBLIC_SUPABASE_URL env var */}
        {/* Note: For better performance, add a preconnect link with the actual Supabase URL if known at build time */}
        <link rel="dns-prefetch" href="https://supabase.co" />
      </head>
      <body style={{ fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif" }}>
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <AntdProvider locale={locale}>{children}</AntdProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

