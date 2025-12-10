"use client";

import { ConfigProvider, App } from "antd";
import esES from "antd/locale/es_ES";
import ptBR from "antd/locale/pt_BR";

const localeMap = {
  es: esES,
  pt: ptBR,
};

export default function AntdProvider({ children, locale = "es" }) {
  const antdLocale = localeMap[locale] || esES;

  return (
    <ConfigProvider
      locale={antdLocale}
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
      <App>
        {children}
      </App>
    </ConfigProvider>
  );
}
