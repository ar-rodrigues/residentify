"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { RiBuildingLine, RiArrowLeftLine } from "react-icons/ri";
import { Result, Space } from "antd";
import Button from "@/components/ui/Button";

export default function OrganizationNotFound({
  title,
  message,
}) {
  const t = useTranslations();
  const router = useRouter();
  
  const defaultTitle = title || t("errors.organizationNotFound.title");
  const defaultMessage = message || t("errors.organizationNotFound.message");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg">
        <div className="[&_.ant-result-image]:!max-w-[180px] [&_.ant-result-image]:sm:!max-w-[220px]">
          <Result
            status="404"
            title={<span className="text-xl sm:text-2xl">{defaultTitle}</span>}
            subTitle={
              <p className="text-sm sm:text-base mt-2 px-2">{defaultMessage}</p>
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
                  {t("errors.organizationNotFound.backToOrganizations")}
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
                  {t("common.back")}
                </Button>
              </Space>
            }
          />
        </div>
      </div>
    </div>
  );
}
