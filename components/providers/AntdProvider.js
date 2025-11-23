"use client";

// Import React 19 compatibility patch before any Ant Design imports
import "@ant-design/v5-patch-for-react-19";

import { ConfigProvider } from "antd";
import esES from "antd/locale/es_ES";

export default function AntdProvider({ children }) {
  return (
    <ConfigProvider
      locale={esES}
      theme={{
        token: {
          colorPrimary: "#2563eb", // blue-600
          colorSuccess: "#16a34a", // green-600
          colorError: "#dc2626", // red-600
          colorWarning: "#ea580c", // orange-600
          colorInfo: "#2563eb", // blue-600
          borderRadius: 8,
          fontFamily: "system-ui, -apple-system, sans-serif",
        },
        components: {
          Button: {
            borderRadius: 8,
            fontWeight: 500,
          },
          Card: {
            borderRadius: 12,
          },
          Input: {
            borderRadius: 8,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
