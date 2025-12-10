import "./globals.css";
import "antd/dist/reset.css";

// Root layout - locale-specific layout is in app/[locale]/layout.js
// This is required by Next.js but the actual rendering happens in [locale]/layout.js
export const metadata = {
  title: "Residentify",
  description: "Sistema de control de acceso para edificios residenciales",
};

export default function RootLayout({ children }) {
  return children;
}
