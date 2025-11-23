"use client";

import {
  RiUserLine,
  RiRocketLine,
  RiCodeLine,
  RiSettingsLine,
} from "react-icons/ri";
import { useUser } from "@/hooks/useUser";
import { Card, Row, Col, Avatar, Typography, Space, Spin } from "antd";
import { formatDateDDMMYYYY } from "@/utils/date";
import Button from "@/components/ui/Button";

const { Title, Paragraph, Text } = Typography;

export default function PrivatePage() {
  const { data: user, loading } = useUser({ redirectToLogin: true });

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Space direction="vertical" align="center" size="large">
          <Spin size="large" />
          <Paragraph className="text-gray-600">Cargando...</Paragraph>
        </Space>
      </div>
    );
  }

  return (
    <div>
      <Space direction="vertical" size="large" className="w-full">
        <div className="text-center">
          <Title level={1}>¡Bienvenido a tu proyecto!</Title>
          <Paragraph className="text-lg text-gray-600">
            Esta es una página protegida que demuestra la funcionalidad de
            autenticación
          </Paragraph>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card title="Información del Usuario">
              <Space direction="vertical" size="middle" className="w-full">
                <Space size="middle">
                  <Avatar
                    icon={<RiUserLine />}
                    size="large"
                    style={{ backgroundColor: "#2563eb" }}
                  />
                  <div>
                    <Text strong>Email:</Text>
                    <br />
                    <Text>{user?.email || "N/A"}</Text>
                  </div>
                </Space>
                <Space size="middle">
                  <RiRocketLine className="text-xl text-green-600" />
                  <div>
                    <Text strong>Miembro desde:</Text>
                    <br />
                    <Text>{formatDateDDMMYYYY(user?.created_at)}</Text>
                  </div>
                </Space>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="Acciones Rápidas">
              <Space direction="vertical" className="w-full" size="small">
                <Button
                  type="primary"
                  icon={<RiRocketLine />}
                  className="w-full"
                  size="large"
                >
                  Crear Nuevo Proyecto
                </Button>
                <Button icon={<RiCodeLine />} className="w-full" size="large">
                  Ver Código Fuente
                </Button>
                <Button
                  icon={<RiSettingsLine />}
                  className="w-full"
                  size="large"
                >
                  Configuración
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        <div className="text-center">
          <Text type="secondary">
            Esta página demuestra que la autenticación está funcionando
            correctamente
          </Text>
        </div>
      </Space>
    </div>
  );
}
