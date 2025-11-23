"use client";

import { useRouter } from "next/navigation";
import { RiHomeLine, RiLoginBoxLine } from "react-icons/ri";
import { Result, Space } from "antd";
import Button from "@/components/ui/Button";

export default function ErrorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <Result
        status="error"
        title="¡Algo salió mal!"
        subTitle="Lo sentimos, ha ocurrido un error inesperado. Por favor, intenta nuevamente."
        extra={
          <Space
            direction="vertical"
            size="middle"
            className="w-full"
            style={{ maxWidth: "400px" }}
          >
            <Button
              type="primary"
              icon={<RiHomeLine />}
              onClick={() => router.push("/")}
              className="w-full"
              size="large"
            >
              Volver al Inicio
            </Button>
            <Button
              icon={<RiLoginBoxLine />}
              onClick={() => router.push("/login")}
              className="w-full"
              size="large"
            >
              Iniciar Sesión
            </Button>
          </Space>
        }
      />
    </div>
  );
}
