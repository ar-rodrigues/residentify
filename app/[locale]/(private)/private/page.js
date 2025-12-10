"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations();
  const { data: user, loading } = useUser({ redirectToLogin: true });

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Space orientation="vertical" align="center" size="large">
          <Spin size="large" />
          <Paragraph className="text-gray-600">{t("private.loading")}</Paragraph>
        </Space>
      </div>
    );
  }

  return (
    <div>
      <Space orientation="vertical" size="large" className="w-full">
        <div className="text-center">
          <Title level={1}>{t("private.title")}</Title>
          <Paragraph className="text-lg text-gray-600">
            {t("private.subtitle")}
          </Paragraph>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card title={t("private.userInfo.title")}>
              <Space orientation="vertical" size="middle" className="w-full">
                <Space size="middle">
                  <Avatar
                    icon={<RiUserLine />}
                    size="large"
                    style={{ backgroundColor: "#2563eb" }}
                  />
                  <div>
                    <Text strong>{t("private.userInfo.email")}</Text>
                    <br />
                    <Text>{user?.email || t("private.userInfo.notAvailable")}</Text>
                  </div>
                </Space>
                <Space size="middle">
                  <RiRocketLine className="text-xl text-green-600" />
                  <div>
                    <Text strong>{t("private.userInfo.memberSince")}</Text>
                    <br />
                    <Text>{formatDateDDMMYYYY(user?.created_at)}</Text>
                  </div>
                </Space>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title={t("private.quickActions.title")}>
              <Space orientation="vertical" className="w-full" size="small">
                <Button
                  type="primary"
                  icon={<RiRocketLine />}
                  className="w-full"
                  size="large"
                >
                  {t("private.quickActions.createProject")}
                </Button>
                <Button icon={<RiCodeLine />} className="w-full" size="large">
                  {t("private.quickActions.viewSource")}
                </Button>
                <Button
                  icon={<RiSettingsLine />}
                  className="w-full"
                  size="large"
                >
                  {t("private.quickActions.settings")}
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        <div className="text-center">
          <Text type="secondary">
            {t("private.footer")}
          </Text>
        </div>
      </Space>
    </div>
  );
}
