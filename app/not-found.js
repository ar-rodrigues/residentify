"use client";

import { useRouter } from "next/navigation";
import { RiHomeLine, RiArrowLeftLine } from "react-icons/ri";
import { Result, Space } from "antd";
import Button from "@/components/ui/Button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Result
        status="404"
        title="404"
        subTitle="Lo sentimos, la página que buscas no existe o ha sido movida."
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
              icon={<RiArrowLeftLine />}
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.history.back();
                }
              }}
              className="w-full"
              size="large"
            >
              Volver Atrás
            </Button>
          </Space>
        }
      />
    </div>
  );
}

