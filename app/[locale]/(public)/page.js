"use client";

import {
  RiRocketLine,
  RiCodeLine,
  RiSettingsLine,
  RiLoginBoxLine,
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useUser } from "@/hooks/useUser";
import { Layout, Typography, Card, Row, Col, Space, Spin } from "antd";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useState, useEffect } from "react";

const { Title, Paragraph } = Typography;

export default function HomePage() {
  const t = useTranslations();
  const router = useRouter();
  const { data: user, loading } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = () => {
    router.push("/login");
  };

  const handleDashboard = () => {
    router.push("/organizations");
  };

  // Prevent hydration mismatch by ensuring consistent initial render
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Space orientation="vertical" align="center" size="large">
          <Spin size="large" />
          <Paragraph className="text-gray-600">{t("common.loading")}</Paragraph>
        </Space>
      </div>
    );
  }

  return (
    <Layout className="min-h-screen">
      <Header>
        <Space size="middle">
          <RiRocketLine className="text-2xl text-blue-600" />
          <Title level={3} className="!mb-0 !text-white">
            Residentify
          </Title>
        </Space>
        <Space size="middle">
          {user ? (
            <Button type="primary" onClick={handleDashboard}>
              {t("home.goToDashboard")}
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<RiLoginBoxLine />}
              onClick={handleLogin}
            >
              {t("home.login")}
            </Button>
          )}
          <LanguageSwitcher />
        </Space>
      </Header>

      <Layout.Content className="p-8">
        <div className="max-w-6xl mx-auto">
          <Space
            orientation="vertical"
            size="large"
            className="w-full mb-16 text-center"
          >
            <Title level={1}>{t("home.title")}</Title>
            <Paragraph className="text-xl text-gray-600">
              {t("home.subtitle")}
            </Paragraph>
            {!user && (
              <Button
                type="primary"
                size="large"
                icon={<RiLoginBoxLine />}
                onClick={handleLogin}
              >
                {t("home.getStarted")}
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
                <Space orientation="vertical" size="large" className="w-full">
                  <RiRocketLine className="text-5xl text-blue-600 mx-auto" />
                  <Title level={4} className="!mb-0">
                    {t("home.features.accessControl.title")}
                  </Title>
                  <Paragraph className="text-gray-600">
                    {t("home.features.accessControl.description")}
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
                <Space orientation="vertical" size="large" className="w-full">
                  <RiCodeLine className="text-5xl text-green-600 mx-auto" />
                  <Title level={4} className="!mb-0">
                    {t("home.features.visitorManagement.title")}
                  </Title>
                  <Paragraph className="text-gray-600">
                    {t("home.features.visitorManagement.description")}
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
                <Space orientation="vertical" size="large" className="w-full">
                  <RiSettingsLine className="text-5xl text-purple-600 mx-auto" />
                  <Title level={4} className="!mb-0">
                    {t("home.features.security.title")}
                  </Title>
                  <Paragraph className="text-gray-600">
                    {t("home.features.security.description")}
                  </Paragraph>
                </Space>
              </Card>
            </Col>
          </Row>

          <Card className="text-center bg-gray-50">
            <Space orientation="vertical" size="middle" className="w-full">
              <Title level={2}>{t("home.cta.title")}</Title>
              <Paragraph className="text-lg text-gray-600">
                {t("home.cta.description")}
              </Paragraph>
              {!user && (
                <Button type="primary" size="large" onClick={handleLogin}>
                  {t("home.cta.button")}
                </Button>
              )}
            </Space>
          </Card>
        </div>
      </Layout.Content>

      <Footer>
        <Paragraph className="text-gray-500 !mb-0">
          {t("home.footer")}
        </Paragraph>
      </Footer>
    </Layout>
  );
}
