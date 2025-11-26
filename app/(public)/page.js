"use client";

import {
  RiRocketLine,
  RiCodeLine,
  RiSettingsLine,
  RiLoginBoxLine,
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { Layout, Typography, Card, Row, Col, Space, Spin } from "antd";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";

const { Title, Paragraph } = Typography;

export default function HomePage() {
  const router = useRouter();
  const { data: user, loading } = useUser();

  const handleLogin = () => {
    router.push("/login");
  };

  const handleDashboard = () => {
    router.push("/organizations");
  };

  if (loading) {
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
    <Layout className="min-h-screen">
      <Header>
        <Space size="middle">
          <RiRocketLine className="text-2xl text-blue-600" />
          <Title level={3} className="!mb-0">
            Residentify
          </Title>
        </Space>
        <Space size="middle">
          {user ? (
            <Button type="primary" onClick={handleDashboard}>
              Ir al Dashboard
            </Button>
          ) : (
            <Button type="primary" icon={<RiLoginBoxLine />} onClick={handleLogin}>
              Iniciar Sesión
            </Button>
          )}
        </Space>
      </Header>

      <Layout.Content className="p-8">
        <div className="max-w-6xl mx-auto">
          <Space direction="vertical" size="large" className="w-full mb-16 text-center">
            <Title level={1}>Residentify</Title>
            <Paragraph className="text-xl text-gray-600">
              Una base sólida para comenzar tu próximo proyecto web con Next.js
            </Paragraph>
            {!user && (
              <Button
                type="primary"
                size="large"
                icon={<RiLoginBoxLine />}
                onClick={handleLogin}
              >
                Comenzar Ahora
              </Button>
            )}
          </Space>

          <Row gutter={[32, 32]} className="mb-16">
            <Col xs={24} md={8}>
              <Card
                hoverable
                className="text-center h-full"
                styles={{
                  body: { padding: "24px" },
                }}
                style={{
                  border: "2px solid #dbeafe",
                }}
              >
                <Space direction="vertical" size="large" className="w-full">
                  <RiRocketLine className="text-5xl text-blue-600 mx-auto" />
                  <Title level={4} className="!mb-0">
                    Inicio Rápido
                  </Title>
                  <Paragraph className="text-gray-600">
                    Configuración lista para usar con Next.js 15, Tailwind CSS y
                    autenticación
                  </Paragraph>
                </Space>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                hoverable
                className="text-center h-full"
                styles={{
                  body: { padding: "24px" },
                }}
                style={{
                  border: "2px solid #dcfce7",
                }}
              >
                <Space direction="vertical" size="large" className="w-full">
                  <RiCodeLine className="text-5xl text-green-600 mx-auto" />
                  <Title level={4} className="!mb-0">
                    Código Limpio
                  </Title>
                  <Paragraph className="text-gray-600">
                    Estructura organizada y componentes reutilizables para un
                    desarrollo eficiente
                  </Paragraph>
                </Space>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                hoverable
                className="text-center h-full"
                styles={{
                  body: { padding: "24px" },
                }}
                style={{
                  border: "2px solid #f3e8ff",
                }}
              >
                <Space direction="vertical" size="large" className="w-full">
                  <RiSettingsLine className="text-5xl text-purple-600 mx-auto" />
                  <Title level={4} className="!mb-0">
                    Fácil Personalización
                  </Title>
                  <Paragraph className="text-gray-600">
                    Modifica y adapta según tus necesidades específicas del proyecto
                  </Paragraph>
                </Space>
              </Card>
            </Col>
          </Row>

          <Card className="text-center bg-gray-50">
            <Space direction="vertical" size="middle" className="w-full">
              <Title level={2}>¿Listo para construir algo increíble?</Title>
              <Paragraph className="text-lg text-gray-600">
                Este starter te da todo lo que necesitas para comenzar tu proyecto
              </Paragraph>
              {!user && (
                <Button type="primary" size="large" onClick={handleLogin}>
                  Crear Cuenta Gratuita
                </Button>
              )}
            </Space>
          </Card>
        </div>
      </Layout.Content>

      <Footer>
        <Paragraph className="text-gray-500 !mb-0">
          © 2024 Residentify. Todos los derechos reservados.
        </Paragraph>
      </Footer>
    </Layout>
  );
}
