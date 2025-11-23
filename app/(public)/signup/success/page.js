"use client";

import { useRouter } from "next/navigation";
import {
  RiRocketLine,
  RiCheckLine,
  RiArrowRightLine,
} from "react-icons/ri";
import { Card, Typography, Space } from "antd";
import Button from "@/components/ui/Button";

const { Title, Paragraph } = Typography;

export default function SignupSuccessPage() {
  const router = useRouter();

  const handleContinue = () => {
    router.push("/private");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Space
          direction="vertical"
          size="large"
          className="w-full text-center mb-8"
        >
          <Space size="middle" className="justify-center">
            <RiRocketLine className="text-4xl text-blue-600" />
            <Title level={2} className="!mb-0">
              Proyecto Starter
            </Title>
          </Space>
        </Space>

        <Card>
          <Space
            direction="vertical"
            size="large"
            className="w-full text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <RiCheckLine className="text-3xl text-green-600" />
            </div>
            <Title level={3}>¡Registro Completado!</Title>
            <Paragraph className="text-gray-600">
              Tu cuenta ha sido creada exitosamente. Ya puedes comenzar a usar
              la plataforma.
            </Paragraph>
            <Space direction="vertical" className="w-full" size="small">
              <Button
                type="primary"
                onClick={handleContinue}
                className="w-full"
                size="large"
                style={{ backgroundColor: "#16a34a" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#15803d";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#16a34a";
                }}
              >
                <Space>
                  Continuar
                  <RiArrowRightLine />
                </Space>
              </Button>
            </Space>
          </Space>
        </Card>
      </div>
    </div>
  );
}

