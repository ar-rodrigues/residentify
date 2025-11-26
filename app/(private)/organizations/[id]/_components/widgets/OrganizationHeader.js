"use client";

import { useRouter } from "next/navigation";
import {
  RiBuildingLine,
  RiEditLine,
  RiCalendarLine,
  RiUserLine,
  RiUserAddLine,
} from "react-icons/ri";
import { Card, Typography, Space } from "antd";
import Button from "@/components/ui/Button";
import { formatDateDDMMYYYY } from "@/utils/date";

const { Title, Text } = Typography;

export default function OrganizationHeader({ organization, organizationId }) {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/organizations/${organizationId}/edit`);
  };

  const handleInvite = () => {
    router.push(`/organizations/${organizationId}/invite`);
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      admin: "Administrador",
      resident: "Residente",
      security: "Personal de Seguridad",
    };
    return roleMap[role] || role;
  };

  return (
    <Card>
      <Space direction="vertical" size="large" className="w-full">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg">
              <RiBuildingLine className="text-3xl text-blue-600" />
            </div>
            <div>
              <Title level={2} className="!mb-2">
                {organization.name}
              </Title>
              {organization.userRole && (
                <Text type="secondary" className="text-sm">
                  Tu rol: <Text strong>{getRoleDisplayName(organization.userRole)}</Text>
                </Text>
              )}
            </div>
          </div>
          {organization.isAdmin && (
            <Space>
              <Button
                type="default"
                icon={<RiUserAddLine />}
                onClick={handleInvite}
                size="large"
              >
                Invitar Usuario
              </Button>
              <Button
                type="primary"
                icon={<RiEditLine />}
                onClick={handleEdit}
                size="large"
              >
                Editar
              </Button>
            </Space>
          )}
        </div>

        <div className="border-t pt-6">
          <Space direction="vertical" size="middle" className="w-full">
            <div className="flex items-start gap-4">
              <RiCalendarLine className="text-xl text-gray-500 mt-1" />
              <div>
                <Text strong className="block mb-1">
                  Fecha de Creación
                </Text>
                <Text type="secondary">
                  {formatDateDDMMYYYY(organization.created_at)}
                </Text>
              </div>
            </div>

            {organization.updated_at && (
              <div className="flex items-start gap-4">
                <RiCalendarLine className="text-xl text-gray-500 mt-1" />
                <div>
                  <Text strong className="block mb-1">
                    Última Actualización
                  </Text>
                  <Text type="secondary">
                    {formatDateDDMMYYYY(organization.updated_at)}
                  </Text>
                </div>
              </div>
            )}

            <div className="flex items-start gap-4">
              <RiUserLine className="text-xl text-gray-500 mt-1" />
              <div>
                <Text strong className="block mb-1">
                  Creado por
                </Text>
                <Text type="secondary">
                  {organization.created_by_name || "Usuario desconocido"}
                </Text>
              </div>
            </div>
          </Space>
        </div>
      </Space>
    </Card>
  );
}

