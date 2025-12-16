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

  const handleOrganizationSelect = async (orgId) => {
    // Validate that the organization is still in the user's list
    // This prevents navigation to organizations the user was removed from
    const orgStillExists = organizations.some((o) => o.id === orgId);
    if (!orgStillExists) {
      // Organization was removed - refetch organizations list
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("organizations:refetch"));
      }
      return;
    }

    // Update main organization before navigating
    try {
      const response = await fetch("/api/profiles/main-organization", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organization_id: orgId }),
      });

      const result = await response.json();

      // If update fails (e.g., user no longer has access), don't navigate
      if (!response.ok || result.error) {
        // Refetch organizations list in case it's stale
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("organizations:refetch"));
        }
        return;
      }
    } catch (err) {
      console.error("Error updating main organization:", err);
      // Don't navigate if there's an error
      return;
    }

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
              <Button type="default" size={isMobile ? "middle" : "large"}>
                {isMobile
                  ? t("organizations.header.change")
                  : t("organizations.header.changeOrganization")}{" "}
                <RiArrowDownSLine />
              </Button>
            </Dropdown>
          )}
        </div>
      </div>
    </div>
  );
}
