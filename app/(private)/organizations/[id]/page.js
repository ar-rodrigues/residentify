"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RiBuildingLine, RiEditLine, RiCalendarLine, RiUserLine } from "react-icons/ri";
import { useOrganizations } from "@/hooks/useOrganizations";
import { Card, Typography, Space, Spin, Alert } from "antd";
import Button from "@/components/ui/Button";
import { formatDateDDMMYYYY } from "@/utils/date";

const { Title, Paragraph, Text } = Typography;

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { getOrganization, data: organization, loading, error } = useOrganizations();
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (id) {
      getOrganization(id).then((result) => {
        if (result.error) {
          setErrorMessage(result.message);
        }
      });
    }
  }, [id, getOrganization]);

  const handleEdit = () => {
    router.push(`/organizations/${id}/edit`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Space direction="vertical" align="center" size="large">
          <Spin size="large" />
          <Paragraph>Cargando organización...</Paragraph>
        </Space>
      </div>
    );
  }

  if (error || errorMessage || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <Card>
            <Space direction="vertical" size="large" className="w-full">
              <Alert
                message="Error"
                description={
                  errorMessage ||
                  error?.message ||
                  "No se pudo cargar la organización."
                }
                type="error"
                showIcon
              />
              <Button
                type="primary"
                onClick={() => router.push("/organizations")}
                className="w-full"
              >
                Volver a Organizaciones
              </Button>
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Space direction="vertical" size="large" className="w-full">
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
                        Tu rol:{" "}
                        <Text strong>
                          {organization.userRole === "admin"
                            ? "Administrador"
                            : organization.userRole === "resident"
                            ? "Residente"
                            : organization.userRole === "security_personnel"
                            ? "Personal de Seguridad"
                            : organization.userRole}
                        </Text>
                      </Text>
                    )}
                  </div>
                </div>
                {organization.isAdmin && (
                  <Button
                    type="primary"
                    icon={<RiEditLine />}
                    onClick={handleEdit}
                    size="large"
                  >
                    Editar
                  </Button>
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

          {/* Placeholder for future sections */}
          <Card title="Miembros">
            <Paragraph type="secondary">
              La gestión de miembros estará disponible próximamente.
            </Paragraph>
          </Card>

          <Card title="Actividad Reciente">
            <Paragraph type="secondary">
              El historial de actividad estará disponible próximamente.
            </Paragraph>
          </Card>
        </Space>
      </div>
    </div>
  );
}

