"use client";

import dynamic from "next/dynamic";

// Dynamically import QRCodeSVG to avoid SSR issues
// Create a wrapper that properly handles the import
const QRCodeSVG = dynamic(
  () =>
    import("react-qr-code").then((mod) => {
      // react-qr-code v2.0+ exports QRCodeSVG as a named export
      // We need to return it as a default export for dynamic()
      const Component = mod.QRCodeSVG || mod.default;
      if (!Component) {
        throw new Error("QRCodeSVG component not found in react-qr-code");
      }
      // Return as default export for Next.js dynamic()
      return { default: Component };
    }),
  {
    ssr: false,
    loading: () => (
      <div className="w-[200px] h-[200px] flex items-center justify-center">
        <span className="text-gray-400">Cargando QR...</span>
      </div>
    ),
  }
);

export default QRCodeSVG;

