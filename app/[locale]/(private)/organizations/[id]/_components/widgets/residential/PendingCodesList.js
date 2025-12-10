"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, Typography, Space, Empty, Spin, App } from "antd";
import { RiQrCodeLine, RiUserLine, RiTimeLine, RiCalendarLine } from "react-icons/ri";
import { useQRCodes } from "@/hooks/useQRCodes";
import { useFormattedDate } from "@/hooks/useFormattedDate";

const { Text, Title } = Typography;

export default function PendingCodesList({ organizationId, onRefresh }) {
  const t = useTranslations();
  const { formatDate } = useFormattedDate();
  const { message } = App.useApp();
  const [pendingCodes, setPendingCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPendingCodes = useCallback(async () => {
    if (!organizationId) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        organization_id: organizationId,
        role: "security",
      });

      const response = await fetch(`/api/qr-codes?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || t("organizations.pendingCodes.error"));
      }

      if (result.error) {
        throw new Error(result.message || t("organizations.pendingCodes.error"));
      }

      setPendingCodes(result.data || []);
    } catch (err) {
      const errorMessage =
        err.message || t("organizations.pendingCodes.errorUnexpected");
      setError(errorMessage);
      message.error(errorMessage);
      setPendingCodes([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId, message]);

  useEffect(() => {
    fetchPendingCodes();
  }, [fetchPendingCodes]);

  useEffect(() => {
    if (onRefresh) {
      // Refresh when onRefresh changes (triggered from parent)
      fetchPendingCodes();
    }
  }, [onRefresh, fetchPendingCodes]);

  const formatDateString = (dateString) => {
    if (!dateString) return "N/A";
    return formatDate(dateString);
  };

  if (loading && pendingCodes.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spin size="large" />
      </div>
    );
  }

  if (error && pendingCodes.length === 0) {
    return (
      <Card>
        <Empty
          description={error}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  if (pendingCodes.length === 0) {
    return (
      <Card>
        <Empty
          description={t("organizations.pendingCodes.empty")}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <div className="w-full">
      <Card>
        <Space orientation="vertical" size="middle" className="w-full">
          <div className="flex justify-between items-center">
            <Title level={5} className="mb-0">
              {t("organizations.pendingCodes.title")}
            </Title>
            <Text type="secondary">
              {t(pendingCodes.length === 1 ? "organizations.pendingCodes.count.single" : "organizations.pendingCodes.count.plural", { count: pendingCodes.length })}
            </Text>
          </div>

          <div className="space-y-3">
            {pendingCodes.map((code) => (
              <Card key={code.id} className="w-full" size="small">
                <Space orientation="vertical" size="small" className="w-full">
                  <div className="flex items-center gap-2">
                    <RiQrCodeLine className="text-blue-500" />
                    <Text strong className="text-lg">
                      {code.identifier || t("organizations.pendingCodes.labels.noIdentifier")}
                    </Text>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <RiUserLine className="text-gray-500" />
                      <Text type="secondary">
                        {t("organizations.pendingCodes.labels.createdBy")}{" "}
                        <Text strong>{code.created_by_name || t("organizations.pendingCodes.labels.unknown")}</Text>
                      </Text>
                    </div>

                    <div className="flex items-center gap-1">
                      <RiTimeLine className="text-gray-500" />
                      <Text type="secondary">
                        {t("organizations.pendingCodes.labels.created")} {formatDateString(code.created_at)}
                      </Text>
                    </div>

                    <div className="flex items-center gap-1">
                      <RiCalendarLine className="text-gray-500" />
                      <Text type="secondary">
                        {t("organizations.pendingCodes.labels.expires")} {formatDateString(code.expires_at)}
                      </Text>
                    </div>
                  </div>
                </Space>
              </Card>
            ))}
          </div>
        </Space>
      </Card>
    </div>
  );
}




