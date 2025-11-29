"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiBuildingLine,
  RiAddLine,
  RiCalendarLine,
  RiArrowRightLine,
} from "react-icons/ri";
import { useOrganizations } from "@/hooks/useOrganizations";
import { Card, Typography, Space, Spin, Row, Col, Empty } from "antd";
import Button from "@/components/ui/Button";
import { formatDateDDMMYYYY } from "@/utils/date";

const { Title, Paragraph, Text } = Typography;

const LAST_USED_ORG_KEY = "lastUsedOrganizationId";

export default function OrganizationsPage() {
  const router = useRouter();
  const { organizations, fetching, error } = useOrganizations();
  const [checkingRedirect, setCheckingRedirect] = useState(true);

  useEffect(() => {
    // Only check redirect after organizations are loaded
    if (!fetching && organizations) {
      const lastUsedId = localStorage.getItem(LAST_USED_ORG_KEY);

      // If there's a last used organization and user is still a member, redirect
      if (lastUsedId && organizations.length > 0) {
        const isValidOrg = organizations.some((org) => org.id === lastUsedId);
        if (isValidOrg) {
          router.push(`/organizations/${lastUsedId}`);
          return;
        } else {
          // Last used org is no longer valid, remove it
          localStorage.removeItem(LAST_USED_ORG_KEY);
        }
      }

      setCheckingRedirect(false);
    }
  }, [fetching, organizations, router]);

  const handleOrganizationClick = (orgId) => {
    // Store the selected organization as last used
    localStorage.setItem(LAST_USED_ORG_KEY, orgId);
    router.push(`/organizations/${orgId}`);
  };

  const handleCreateOrganization = () => {
    router.push("/organizations/create");
  };

  // Show loading while checking redirect or fetching organizations
  if (checkingRedirect || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Space direction="vertical" align="center" size="large">
          <Spin size="large" />
          <Paragraph>Cargando organizaciones...</Paragraph>
        </Space>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <Card>
            <Space direction="vertical" size="large" className="w-full">
              <Paragraph type="danger">
                Error al cargar las organizaciones. Por favor, intenta
                nuevamente.
              </Paragraph>
              <Button
                type="primary"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Reintentar
              </Button>
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  // Empty state - no organizations
  if (!organizations || organizations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <Space
              direction="vertical"
              size="large"
              className="w-full text-center"
            >
              <div className="flex justify-center mb-4">
                <RiBuildingLine className="text-6xl text-blue-600" />
              </div>
              <Title level={2}>No tienes organizaciones</Title>
              <Paragraph className="text-gray-600 text-lg">
                Crea tu primera organización para comenzar a gestionar accesos y
                miembros
              </Paragraph>
              <Button
                type="primary"
                icon={<RiAddLine />}
                onClick={handleCreateOrganization}
                size="large"
                className="mt-4"
              >
                Crear Organización
              </Button>
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  // Show list of organizations
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Space direction="vertical" size="large" className="w-full">
          <div className="flex justify-between items-center">
            <div>
              <Title level={2}>Mis Organizaciones</Title>
              <Paragraph type="secondary">
                Selecciona una organización para gestionarla
              </Paragraph>
            </div>
            <Button
              type="primary"
              icon={<RiAddLine />}
              onClick={handleCreateOrganization}
              size="large"
            >
              Crear Organización
            </Button>
          </div>

          <Row gutter={[24, 24]}>
            {organizations.map((org) => (
              <Col xs={24} sm={12} lg={8} key={org.id}>
                <Card
                  hoverable
                  className="h-full cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => handleOrganizationClick(org.id)}
                >
                  <Space
                    direction="vertical"
                    size="middle"
                    className="w-full"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                        <RiBuildingLine className="text-2xl text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Title level={4} className="!mb-0 truncate">
                          {org.name}
                        </Title>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-500">
                      <RiCalendarLine className="text-base" />
                      <Text type="secondary" className="text-sm">
                        Creada: {formatDateDDMMYYYY(org.created_at)}
                      </Text>
                    </div>

                    <div className="flex items-center justify-end pt-2 border-t">
                      <Text type="secondary" className="text-sm flex items-center gap-1">
                        Ver detalles
                        <RiArrowRightLine />
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Space>
      </div>
    </div>
  );
}




