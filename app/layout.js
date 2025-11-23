import "./globals.css";
import "antd/dist/reset.css";
import AntdProvider from "@/components/providers/AntdProvider";

export const metadata = {
  title: "Residentify",
  description:
    "Un proyecto completo y listo para usar con Next.js 15, Tailwind CSS 4 y autenticación",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <AntdProvider>{children}</AntdProvider>
      </body>
    </html>
  );
}
