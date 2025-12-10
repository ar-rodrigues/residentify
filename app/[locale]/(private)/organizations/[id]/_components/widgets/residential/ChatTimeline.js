"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Spin, Empty, Typography } from "antd";
import { useQRCodes } from "@/hooks/useQRCodes";
import { useAccessLogs } from "@/hooks/useAccessLogs";
import { useNotifications } from "@/hooks/useNotifications";
import ChatMessage from "./ChatMessage";
import QRCodeCard from "./QRCodeCard";

const { Text } = Typography;

export default function ChatTimeline({ organizationId, filter = "all" }) {
  const t = useTranslations();
  const [timelineItems, setTimelineItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQRCode, setSelectedQRCode] = useState(null);
  const timelineRef = useRef(null);

  const { getQRCodes, data: qrCodesData } = useQRCodes();
  const { getAccessLogs, data: accessLogsData } = useAccessLogs();
  const {
    getNotifications,
    data: notificationsData,
    markAsRead,
  } = useNotifications();

  const loadTimelineData = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { organization_id: organizationId };
      await Promise.all([
        getQRCodes(filters),
        getAccessLogs(filters),
        getNotifications(filters),
      ]);
    } catch (error) {
      console.error("Error loading timeline data:", error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, getQRCodes, getAccessLogs, getNotifications]);

  const mergeTimelineItems = useCallback(() => {
    const items = [];

    // Add QR codes
    if (filter === "all" || filter === "qr_codes") {
      if (qrCodesData && Array.isArray(qrCodesData)) {
        qrCodesData.forEach((qrCode) => {
          items.push({
            type: "qr_code",
            timestamp: qrCode.created_at,
            ...qrCode,
          });
        });
      }
    }

    // Add access logs
    if (filter === "all" || filter === "access_events") {
      if (accessLogsData && Array.isArray(accessLogsData)) {
        accessLogsData.forEach((log) => {
          items.push({
            type: log.entry_type === "entry" ? "access_entry" : "access_exit",
            timestamp: log.timestamp,
            ...log,
          });
        });
      }
    }

    // Add notifications
    if (filter === "all" || filter === "notifications") {
      if (notificationsData && Array.isArray(notificationsData)) {
        notificationsData.forEach((notification) => {
          items.push({
            type: "notification",
            timestamp: notification.created_at,
            ...notification,
          });
        });
      }
    }

    // Sort by timestamp (newest first)
    items.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    setTimelineItems(items);
  }, [qrCodesData, accessLogsData, notificationsData, filter]);

  useEffect(() => {
    loadTimelineData();
  }, [organizationId, filter, loadTimelineData]);

  useEffect(() => {
    mergeTimelineItems();
  }, [mergeTimelineItems]);

  useEffect(() => {
    // Auto-scroll to bottom when new items are added
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [timelineItems]);

  const handleMessageClick = async (item) => {
    if (item.type === "notification" && !item.is_read) {
      await markAsRead(item.id);
    } else if (item.type === "qr_code") {
      setSelectedQRCode(item);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (timelineItems.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Empty
          description={
            <Text type="secondary">
              {filter === "all"
                ? t("qrCodes.chatTimeline.emptyStates.noActivity")
                : filter === "qr_codes"
                ? t("qrCodes.chatTimeline.emptyStates.noQRCodesCreated")
                : filter === "access_events"
                ? t("qrCodes.chatTimeline.emptyStates.noAccessRecords")
                : t("qrCodes.chatTimeline.emptyStates.noNotifications")}
            </Text>
          }
        />
      </div>
    );
  }

  return (
    <div className="relative">
      {selectedQRCode && (
        <div className="mb-4">
          <QRCodeCard
            qrCode={selectedQRCode}
            onClose={() => setSelectedQRCode(null)}
          />
        </div>
      )}

      <div
        ref={timelineRef}
        className="max-h-[600px] overflow-y-auto pr-2"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#cbd5e0 #f7fafc",
        }}
      >
        {timelineItems.map((item, index) => (
          <ChatMessage
            key={`${item.type}-${item.id || item.timestamp}-${index}`}
            item={item}
            type={item.type}
            onClick={() => handleMessageClick(item)}
          />
        ))}
      </div>
    </div>
  );
}
