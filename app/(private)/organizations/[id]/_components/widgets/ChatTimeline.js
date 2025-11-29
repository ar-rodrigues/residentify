"use client";

import { useEffect, useState, useRef } from "react";
import { Spin, Empty, Typography } from "antd";
import { useQRCodes } from "@/hooks/useQRCodes";
import { useAccessLogs } from "@/hooks/useAccessLogs";
import { useNotifications } from "@/hooks/useNotifications";
import ChatMessage from "./ChatMessage";
import QRCodeCard from "./QRCodeCard";

const { Text } = Typography;

export default function ChatTimeline({ organizationId, filter = "all" }) {
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

  useEffect(() => {
    loadTimelineData();
  }, [organizationId, filter]);

  useEffect(() => {
    mergeTimelineItems();
  }, [qrCodesData, accessLogsData, notificationsData, filter]);

  useEffect(() => {
    // Auto-scroll to bottom when new items are added
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [timelineItems]);

  const loadTimelineData = async () => {
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
  };

  const mergeTimelineItems = () => {
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
  };

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
                ? "No hay actividad aún"
                : filter === "qr_codes"
                ? "No has creado códigos QR"
                : filter === "access_events"
                ? "No hay registros de acceso"
                : "No hay notificaciones"}
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
