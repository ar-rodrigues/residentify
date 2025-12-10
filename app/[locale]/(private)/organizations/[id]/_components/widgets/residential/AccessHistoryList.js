"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, Typography, Space, Empty, Spin, Tag, App } from "antd";
import {
  RiHistoryLine,
  RiUserLine,
  RiTimeLine,
  RiLoginBoxLine,
  RiLogoutBoxLine,
  RiFileTextLine,
} from "react-icons/ri";
import { useAccessLogs } from "@/hooks/useAccessLogs";
import { useFormattedDate } from "@/hooks/useFormattedDate";

const { Text, Title } = Typography;

export default function AccessHistoryList({ organizationId }) {
  const t = useTranslations();
  const { formatDate } = useFormattedDate();
  const { message } = App.useApp();
  const { getAccessLogs, loading, data: accessLogs } = useAccessLogs();
  const [error, setError] = useState(null);

  const fetchAccessLogs = useCallback(async () => {
    if (!organizationId) return;

    try {
      setError(null);
      const result = await getAccessLogs({
        organization_id: organizationId,
        limit: 100,
        offset: 0,
      });

      if (result.error) {
        setError(result.message);
        message.error(result.message);
      }
    } catch (err) {
      const errorMessage =
        err.message || t("organizations.accessHistory.error");
      setError(errorMessage);
      message.error(errorMessage);
    }
  }, [organizationId, getAccessLogs, message]);

  useEffect(() => {
    fetchAccessLogs();
  }, [fetchAccessLogs]);

  const formatDateString = (dateString) => {
    if (!dateString) return "N/A";
    return formatDate(dateString);
  };

  const getEntryTypeDisplay = (entryType) => {
    switch (entryType) {
      case "entry":
        return { text: t("organizations.accessHistory.entryTypes.entry"), color: "green", icon: <RiLoginBoxLine /> };
      case "exit":
        return { text: t("organizations.accessHistory.entryTypes.exit"), color: "red", icon: <RiLogoutBoxLine /> };
      default:
        return { text: entryType || "N/A", color: "default", icon: null };
    }
  };

  if (loading && !accessLogs) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spin size="large" />
      </div>
    );
  }

  if (error && (!accessLogs || accessLogs.length === 0)) {
    return (
      <Card>
        <Empty
          description={error}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  if (!accessLogs || accessLogs.length === 0) {
    return (
      <Card>
        <Empty
          description={t("organizations.accessHistory.empty")}
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
              {t("organizations.accessHistory.title")}
            </Title>
            <Text type="secondary">
              {t(accessLogs.length === 1 ? "organizations.accessHistory.count.single" : "organizations.accessHistory.count.plural", { count: accessLogs.length })}
            </Text>
          </div>

          <div className="space-y-3">
            {accessLogs.map((log, index) => {
              const entryTypeInfo = getEntryTypeDisplay(log.entry_type);
              return (
                <Card key={log.id || `log-${index}-${log.timestamp}`} className="w-full" size="small">
                  <Space orientation="vertical" size="small" className="w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {entryTypeInfo.icon}
                        <Tag color={entryTypeInfo.color}>
                          {entryTypeInfo.text}
                        </Tag>
                      </div>
                      <Text type="secondary" className="text-xs">
                        {formatDateString(log.timestamp)}
                      </Text>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      {log.visitor_name && (
                        <div className="flex items-center gap-1">
                          <RiUserLine className="text-gray-500" />
                          <Text type="secondary">
                            {t("organizations.accessHistory.labels.visitor")} <Text strong>{log.visitor_name}</Text>
                          </Text>
                        </div>
                      )}

                      {log.scanned_by_name && (
                        <div className="flex items-center gap-1">
                          <RiHistoryLine className="text-gray-500" />
                          <Text type="secondary">
                            {t("organizations.accessHistory.labels.scannedBy")} <Text strong>{log.scanned_by_name}</Text>
                          </Text>
                        </div>
                      )}

                      {log.qr_code?.identifier && (
                        <div className="flex items-center gap-1">
                          <RiFileTextLine className="text-gray-500" />
                          <Text type="secondary">
                            {t("organizations.accessHistory.labels.identifier")} <Text code>{log.qr_code.identifier}</Text>
                          </Text>
                        </div>
                      )}
                    </div>

                    {log.notes && (
                      <div className="mt-2">
                        <Text type="secondary" className="text-xs italic">
                          {t("organizations.accessHistory.labels.notes")} {log.notes}
                        </Text>
                      </div>
                    )}
                  </Space>
                </Card>
              );
            })}
          </div>
        </Space>
      </Card>
    </div>
  );
}




