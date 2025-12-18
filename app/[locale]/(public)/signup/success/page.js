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
    router.push("/organizations");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(to bottom right, var(--color-bg-secondary), var(--color-bg-elevated))",
      }}
    >
      <div className="w-full max-w-md">
        <Space
          orientation="vertical"
          size="large"
          className="w-full text-center mb-8"
        >
          <Space size="middle" className="justify-center">
            <RiRocketLine
              className="text-4xl"
              style={{ color: "var(--color-primary)" }}
            />
            <Title level={2} className="!mb-0" style={{ color: "var(--color-text-primary)" }}>
              Residentify
            </Title>
          </Space>
        </Space>

        <Card>
          <Space
            orientation="vertical"
            size="large"
            className="w-full text-center"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{
                backgroundColor: "var(--color-primary-bg)",
              }}
            >
              <RiCheckLine
                className="text-3xl"
                style={{ color: "var(--color-primary)" }}
              />
            </div>
            <Title level={3} style={{ color: "var(--color-text-primary)" }}>
              ¡Registro Completado!
            </Title>
            <Paragraph style={{ color: "var(--color-text-secondary)" }}>
              Tu cuenta ha sido creada exitosamente. Ya puedes comenzar a usar
              la plataforma.
            </Paragraph>
            <Space orientation="vertical" className="w-full" size="small">
              <Button
                type="primary"
                onClick={handleContinue}
                className="w-full"
                size="large"
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

