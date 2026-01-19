"use client";

import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { Alert, Button } from "antd";
import { RiSnowflakeLine, RiMoneyDollarBoxLine } from "react-icons/ri";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export default function FrozenBanner() {
  const { organization, hasPermission } = useCurrentOrganization();
  const router = useRouter();
  const locale = useLocale();

  if (!organization || !organization.is_frozen) {
    return null;
  }

  const isAdmin = hasPermission("org:update");

  return (
    <div className="mb-4">
      <Alert
        message="Asiento Congelado"
        description={
          <div className="flex flex-col gap-2">
            <span>
              Tu asiento en esta organización ha sido congelado porque se ha excedido el límite de asientos contratados o el paquete ha expirado.
            </span>
            {isAdmin && (
              <Button 
                type="primary" 
                size="small" 
                icon={<RiMoneyDollarBoxLine />}
                onClick={() => router.push(`/${locale}/organizations/${organization.id}/billing`)}
                className="w-fit"
              >
                Gestionar Planes
              </Button>
            )}
          </div>
        }
        type="warning"
        showIcon
        icon={<RiSnowflakeLine className="text-xl" />}
      />
    </div>
  );
}
