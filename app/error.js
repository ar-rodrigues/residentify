"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RiHomeLine, RiRefreshLine } from "react-icons/ri";
import { Result, Space } from "antd";
import Button from "@/components/ui/Button";

export default function Error({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Error boundary caught an error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <Result
        status="error"
        title="¡Algo salió mal!"
        subTitle={
          error?.message ||
          "Lo sentimos, ha ocurrido un error inesperado. Por favor, intenta nuevamente."
        }
        extra={
          <Space
            direction="vertical"
            size="middle"
            className="w-full"
            style={{ maxWidth: "400px" }}
          >
            <Button
              type="primary"
              icon={<RiRefreshLine />}
              onClick={reset}
              className="w-full"
              size="large"
            >
              Intentar Nuevamente
            </Button>
            <Button
              icon={<RiHomeLine />}
              onClick={() => router.push("/")}
              className="w-full"
              size="large"
            >
              Volver al Inicio
            </Button>
          </Space>
        }
      />
    </div>
  );
}

