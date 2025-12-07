"use client";

import { useRouter } from "next/navigation";
import { RiBuildingLine, RiArrowLeftLine } from "react-icons/ri";
import { Result, Space } from "antd";
import Button from "@/components/ui/Button";

export default function OrganizationNotFound({
  title = "Organización No Encontrada",
  message = "Lo sentimos, la organización que buscas no existe o no tienes acceso a ella.",
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg">
        <div className="[&_.ant-result-image]:!max-w-[180px] [&_.ant-result-image]:sm:!max-w-[220px]">
          <Result
            status="404"
            title={<span className="text-xl sm:text-2xl">{title}</span>}
            subTitle={
              <p className="text-sm sm:text-base mt-2 px-2">{message}</p>
            }
            extra={
              <Space
                vertical
                size="middle"
                className="w-full mt-4 sm:mt-6"
                style={{ maxWidth: "400px" }}
              >
                <Button
                  type="primary"
                  icon={<RiBuildingLine />}
                  onClick={() => router.push("/organizations")}
                  className="w-full"
                  size="large"
                >
                  Volver a Organizaciones
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
      </div>
    </div>
  );
}
