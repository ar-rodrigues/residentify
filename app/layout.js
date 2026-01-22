import "./globals.css";
import "antd/dist/reset.css";

// Root layout - locale-specific layout is in app/[locale]/layout.js
// This is required by Next.js but the actual rendering happens in [locale]/layout.js
export const metadata = {
  title: "Residentify",
  description: "Sistema de control de acceso para edificios residenciales",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Residentify",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/residentify-192x192.png",
    shortcut: "/icons/residentify-192x192.png",
    apple: "/icons/residentify-192x192.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Residentify",
    "msapplication-TileColor": "#000000",
    "theme-color": "#000000",
  },
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return children;
}
