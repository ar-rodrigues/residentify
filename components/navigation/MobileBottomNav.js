"use client";

import {
  RiRocketLine,
  RiTeamLine,
  RiDashboardLine,
} from "react-icons/ri";
import { useRouter, usePathname } from "next/navigation";
import { useMemo } from "react";
import { getPrivateMenu } from "@/utils/config/app";

// Icon mapping for menu items
const iconMap = {
  RiDashboardLine: RiDashboardLine,
  RiRocketLine: RiRocketLine,
  RiTeamLine: RiTeamLine,
};

export default function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  // Get menu items from config, excluding profile (it will be in header)
  const menuItems = useMemo(() => {
    const privateMenu = getPrivateMenu();
    return privateMenu
      .filter((item) => item.key !== "/profile") // Remove profile from mobile menu
      .map((item) => {
        const IconComponent = iconMap[item.iconName];
        return {
          key: item.key,
          icon: IconComponent,
          label: item.label,
        };
      });
  }, []);

  const handleItemClick = (key) => {
    router.push(key);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-center justify-around h-16">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = pathname === item.key || pathname.startsWith(item.key + "/");
          
          return (
            <button
              key={item.key}
              onClick={() => handleItemClick(item.key)}
              className={`
                flex flex-col items-center justify-center flex-1 h-full
                transition-colors duration-200
                ${isActive 
                  ? "text-blue-600" 
                  : "text-gray-500 hover:text-gray-700"
                }
              `}
              aria-label={item.label}
            >
              {IconComponent && (
                <IconComponent 
                  className={`text-xl mb-1 ${isActive ? "text-blue-600" : ""}`}
                />
              )}
              <span 
                className={`
                  text-xs font-medium
                  ${isActive ? "text-blue-600" : "text-gray-500"}
                `}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

