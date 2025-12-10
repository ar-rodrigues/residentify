"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { RiBuildingLine, RiAddLine, RiArrowDownSLine } from "react-icons/ri";
import { Typography, Dropdown, Space, Spin } from "antd";
import Button from "@/components/ui/Button";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useIsMobile } from "@/hooks/useMediaQuery";

const { Text } = Typography;

export default function OrganizationHeader({ organization, organizationId }) {
  const t = useTranslations();
  const router = useRouter();
  const { organizations, fetching } = useOrganizations();
  const isMobile = useIsMobile();

  const handleOrganizationSelect = (orgId) => {
    router.push(`/organizations/${orgId}`);
  };

  const handleCreateOrganization = () => {
    router.push("/organizations/create");
  };

  // Build dropdown menu items
  const otherOrganizations = organizations.filter(
    (org) => org.id !== organizationId
  );

  const menuItems = [
    ...otherOrganizations.map((org) => ({
      key: org.id,
      label: org.name,
      onClick: () => handleOrganizationSelect(org.id),
    })),
    ...(otherOrganizations.length > 0
      ? [
          {
            type: "divider",
          },
        ]
      : []),
    {
      key: "create",
      label: (
        <Space>
          <RiAddLine />
          <span>{t("organizations.header.createNew")}</span>
        </Space>
      ),
      onClick: handleCreateOrganization,
    },
  ];

  return (
    <div
      className="w-full bg-white border-b border-gray-200"
      style={{
        padding: isMobile ? "12px 16px" : "16px 24px",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg flex-shrink-0">
            <RiBuildingLine className="text-xl text-blue-600" />
          </div>
          <Text
            strong
            className="text-lg md:text-xl"
            ellipsis
            style={{ margin: 0 }}
          >
            {organization.name}
          </Text>
        </div>

        <div className="flex-shrink-0 ml-4">
          {fetching ? (
            <Spin size="small" />
          ) : (
            <Dropdown
              menu={{ items: menuItems }}
              placement="bottomRight"
              trigger={["click"]}
            >
              <Button
                type="default"
                icon={<RiArrowDownSLine />}
                iconPlacement="end"
                size={isMobile ? "middle" : "large"}
              >
                {isMobile ? t("organizations.header.change") : t("organizations.header.changeOrganization")}
              </Button>
            </Dropdown>
          )}
        </div>
      </div>
    </div>
  );
}
