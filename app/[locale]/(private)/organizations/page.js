"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  RiBuildingLine,
  RiAddLine,
  RiCalendarLine,
  RiArrowRightLine,
} from "react-icons/ri";
import { useOrganizations } from "@/hooks/useOrganizations";
import { Card, Typography, Space, Spin, Row, Col, Empty } from "antd";
import Button from "@/components/ui/Button";
import { formatDateDDMMYYYY } from "@/utils/date";
import { useIsMobile } from "@/hooks/useMediaQuery";

const { Title, Paragraph, Text } = Typography;

export default function OrganizationsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { organizations, fetching, error, refetch } = useOrganizations();
  const [checkingRedirect, setCheckingRedirect] = useState(true);
  const [mainOrganizationId, setMainOrganizationId] = useState(null);
  const [mainOrgFetchCompleted, setMainOrgFetchCompleted] = useState(false);
  const isMobile = useIsMobile();

  // Refetch organizations when page becomes visible (e.g., after redirect from invitation acceptance)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refetch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refetch]);

  // Also refetch when component mounts to ensure fresh data
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Fetch main organization ID
  useEffect(() => {
    const fetchMainOrganization = async () => {
      try {
        const response = await fetch("/api/profiles/main-organization");
        const result = await response.json();
        
        if (!result.error && result.data) {
          setMainOrganizationId(result.data);
        } else {
          // User doesn't have a main organization (valid state)
          setMainOrganizationId(null);
        }
      } catch (err) {
        console.error("Error fetching main organization:", err);
        // On error, treat as no main organization
        setMainOrganizationId(null);
      } finally {
        setMainOrgFetchCompleted(true);
      }
    };

    fetchMainOrganization();
  }, []);

  useEffect(() => {
    // Only check redirect after organizations are loaded and main org fetch is completed
    if (!fetching && organizations && mainOrgFetchCompleted) {
      // If user has a main organization and is still a member, redirect to it
      if (mainOrganizationId && organizations.length > 0) {
        const org = organizations.find((org) => org.id === mainOrganizationId);
        if (org && !org.isPendingApproval) {
          router.push(`/organizations/${mainOrganizationId}`);
          return;
        }
      }

      // If user has exactly one organization and it's not pending approval, set as main and redirect
      if (organizations.length === 1 && !organizations[0].isPendingApproval) {
        const singleOrgId = organizations[0].id;
        
        // Set as main organization
        fetch("/api/profiles/main-organization", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ organization_id: singleOrgId }),
        }).catch((err) => {
          console.error("Error setting main organization:", err);
        });

        router.push(`/organizations/${singleOrgId}`);
        return;
      }

      setCheckingRedirect(false);
    }
  }, [fetching, organizations, mainOrganizationId, mainOrgFetchCompleted, router]);

  const handleOrganizationClick = async (orgId) => {
    // Update main organization before redirecting
    try {
      const response = await fetch("/api/profiles/main-organization", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organization_id: orgId }),
      });

      if (!response.ok) {
        console.error("Error updating main organization");
        // Continue anyway - not critical
      }
    } catch (err) {
      console.error("Error updating main organization:", err);
      // Continue anyway - not critical
    }

    router.push(`/organizations/${orgId}`);
  };

  const handleCreateOrganization = () => {
    router.push("/organizations/create");
  };

  // Show loading while checking redirect or fetching organizations
  if (checkingRedirect || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Space orientation="vertical" align="center" size="large">
          <Spin size="large" />
          <Paragraph>{t("organizations.loading")}</Paragraph>
        </Space>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-6 px-4 sm:py-12">
        <div className="max-w-md w-full">
          <Card>
            <Space orientation="vertical" size="large" className="w-full">
              <Paragraph type="danger">
                {t("organizations.error.message")}
              </Paragraph>
              <Button
                type="primary"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                {t("organizations.error.retry")}
              </Button>
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  // Empty state - no organizations
  if (!organizations || organizations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <Space
              orientation="vertical"
              size="large"
              className="w-full text-center"
            >
              <div className="flex justify-center mb-4">
                <RiBuildingLine className="text-5xl sm:text-6xl text-blue-600" />
              </div>
              <Title level={3} className="sm:!text-3xl">
                {t("organizations.empty.title")}
              </Title>
              <Paragraph className="text-gray-600 text-base sm:text-lg">
                {t("organizations.empty.description")}
              </Paragraph>
              <Button
                type="primary"
                icon={<RiAddLine />}
                onClick={handleCreateOrganization}
                size="large"
                className="mt-4 w-full sm:w-auto"
              >
                {t("organizations.empty.button")}
              </Button>
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  // Show list of organizations
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Space orientation="vertical" size="large" className="w-full">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <Title level={3} className="sm:!text-3xl !mb-1 sm:!mb-2">
                {t("organizations.title")}
              </Title>
              <Paragraph type="secondary" className="text-sm sm:text-base">
                {t("organizations.subtitle")}
              </Paragraph>
            </div>
            <Button
              type="primary"
              icon={<RiAddLine />}
              onClick={handleCreateOrganization}
              size="large"
              className="w-full sm:w-auto"
            >
              {t("organizations.create")}
            </Button>
          </div>

          <Row gutter={isMobile ? [16, 16] : [24, 24]}>
            {organizations.map((org) => (
              <Col xs={24} sm={12} lg={8} key={org.id}>
                <Card
                  hoverable={!org.isPendingApproval}
                  className={`h-full transition-all ${
                    org.isPendingApproval
                      ? "opacity-75 cursor-not-allowed"
                      : "cursor-pointer hover:shadow-lg"
                  }`}
                  onClick={() => {
                    if (!org.isPendingApproval) {
                      handleOrganizationClick(org.id);
                    }
                  }}
                  styles={{ body: { padding: "16px" } }}
                >
                  <Space orientation="vertical" size="middle" className="w-full">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex-shrink-0">
                        <RiBuildingLine className="text-xl sm:text-2xl text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Title
                          level={4}
                          className="!mb-0 truncate text-base sm:text-lg"
                        >
                          {org.name}
                        </Title>
                      </div>
                    </div>

                    {org.isPendingApproval && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                        <Text className="text-xs sm:text-sm text-yellow-800">
                          {t("organizations.card.pendingApproval")}
                        </Text>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-gray-500">
                      <RiCalendarLine className="text-sm sm:text-base" />
                      <Text type="secondary" className="text-xs sm:text-sm">
                        {t("organizations.card.created")} {formatDateDDMMYYYY(org.created_at)}
                      </Text>
                    </div>

                    {!org.isPendingApproval && (
                      <div className="flex items-center justify-end pt-2 border-t min-h-[44px]">
                        <Text
                          type="secondary"
                          className="text-xs sm:text-sm flex items-center gap-1"
                        >
                          {t("organizations.card.viewDetails")}
                          <RiArrowRightLine />
                        </Text>
                      </div>
                    )}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Space>
      </div>
    </div>
  );
}
