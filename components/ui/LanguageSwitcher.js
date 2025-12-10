"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Dropdown, Avatar } from "antd";
import { RiGlobalLine } from "react-icons/ri";
import { useState, useEffect } from "react";

const languages = [
  { value: "es", label: "Español" },
  { value: "pt", label: "Português (BR)" },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLanguageChange = ({ key: newLocale }) => {
    // Get current path without locale prefix
    const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";

    // Save preference to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred-locale", newLocale);
    }

    // Navigate to new locale path
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  const menuItems = languages.map((lang) => ({
    key: lang.value,
    label: lang.label,
    ...(locale === lang.value && { className: "ant-menu-item-selected" }),
  }));

  if (!mounted) {
    return (
      <Avatar
        icon={<RiGlobalLine />}
        style={{
          backgroundColor: "#2563eb",
          opacity: 0.5,
        }}
        size="default"
      />
    );
  }

  return (
    <Dropdown
      menu={{
        items: menuItems,
        onClick: handleLanguageChange,
        selectedKeys: [locale],
      }}
      placement="bottomRight"
      trigger={["click"]}
    >
      <Avatar
        icon={<RiGlobalLine />}
        style={{
          backgroundColor: "#2563eb",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        className="hover:opacity-80 hover:scale-110 active:scale-95"
        size="default"
      />
    </Dropdown>
  );
}
