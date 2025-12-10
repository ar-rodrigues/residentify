"use client";

import { useTranslations, useLocale } from "next-intl";
import { Card, Space, Typography, Badge } from "antd";
import {
  RiQrCodeLine,
  RiLoginBoxLine,
  RiLogoutBoxLine,
  RiNotificationLine,
  RiUserLine,
  RiTimeLine,
} from "react-icons/ri";
import { formatDateDDMMYYYY } from "@/utils/date";
import dayjs from "dayjs";
import "dayjs/locale/es";
import "dayjs/locale/pt-br";

const { Text, Paragraph } = Typography;

export default function ChatMessage({ item, type, onClick }) {
  const t = useTranslations();
  const locale = useLocale();
  
  // Set dayjs locale based on current locale
  dayjs.locale(locale === "pt" ? "pt-br" : "es");
  const getTypeIcon = () => {
    switch (type) {
      case "qr_code":
        return <RiQrCodeLine className="text-blue-500" />;
      case "access_entry":
        return <RiLoginBoxLine className="text-green-500" />;
      case "access_exit":
        return <RiLogoutBoxLine className="text-orange-500" />;
      case "notification":
        return <RiNotificationLine className="text-purple-500" />;
      default:
        return <RiUserLine className="text-gray-500" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case "qr_code":
        return t("qrCodes.chat.qrCodeCreated");
      case "access_entry":
        return t("qrCodes.chat.entryRegistered");
      case "access_exit":
        return t("qrCodes.chat.exitRegistered");
      case "notification":
        return t("qrCodes.chat.notification");
      default:
        return t("qrCodes.chat.event");
    }
  };

  const getTimestamp = () => {
    if (type === "qr_code") {
      return item.created_at;
    } else if (type === "access_entry" || type === "access_exit") {
      return item.timestamp;
    } else if (type === "notification") {
      return item.created_at;
    }
    return null;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = dayjs(timestamp);
    const now = dayjs();
    const diffDays = now.diff(date, "day");

    if (diffDays === 0) {
      return `${t("dates.todayAt")} ${date.format("HH:mm")}`;
    } else if (diffDays === 1) {
      return `${t("dates.yesterdayAt")} ${date.format("HH:mm")}`;
    } else if (diffDays < 7) {
      // Use dayjs locale for day names
      const dayName = date.format("dddd");
      return `${dayName} ${t("dates.at")} ${date.format("HH:mm")}`;
    } else {
      return formatDateDDMMYYYY(timestamp) + " " + date.format("HH:mm");
    }
  };

  const renderContent = () => {
    switch (type) {
      case "qr_code":
        return (
          <div>
            <Text strong className="block mb-1">
              {item.visitor_name
                ? `${t("qrCodes.chat.qrCodeFor")} ${item.visitor_name}`
                : t("qrCodes.chat.qrCodeCreated")}
            </Text>
            <Text type="secondary" className="text-sm">
              {item.visitor_name && item.visitor_id && `${item.visitor_id} • `}
              {item.expires_at
                ? `${t("qrCodes.chat.expires")} ${formatDateDDMMYYYY(item.expires_at)}`
                : item.created_at
                ? `${t("qrCodes.chat.created")} ${formatDateDDMMYYYY(item.created_at)}`
                : ""}
            </Text>
          </div>
        );

      case "access_entry":
      case "access_exit":
        return (
          <div>
            <Text strong className="block mb-1">
              {item.visitor_name || item.qr_code?.visitor_name || t("qrCodes.chat.visitor")}{" "}
              {type === "access_entry" ? t("qrCodes.chat.entered") : t("qrCodes.chat.exited")}
            </Text>
            <Text type="secondary" className="text-sm">
              {item.scanned_by_name &&
                `${t("qrCodes.chat.scannedBy")} ${item.scanned_by_name} • `}
              {formatTime(item.timestamp)}
            </Text>
            {item.notes && (
              <Paragraph type="secondary" className="text-xs mt-1 mb-0">
                {item.notes}
              </Paragraph>
            )}
          </div>
        );

      case "notification":
        return (
          <div>
            <Text strong className="block mb-1">
              {item.from_user_name || "Personal de Seguridad"}
            </Text>
            <Paragraph className="mb-0">{item.message}</Paragraph>
            {item.qr_code && (
              <Text type="secondary" className="text-xs block mt-1">
                Relacionado con: {item.qr_code.visitor_name}
              </Text>
            )}
          </div>
        );

      default:
        return <Text>{JSON.stringify(item)}</Text>;
    }
  };

  const isUnread = type === "notification" && !item.is_read;

  return (
    <Card
      className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
        isUnread ? "bg-blue-50 border-blue-200" : ""
      }`}
      onClick={onClick}
      size="small"
    >
      <Space orientation="vertical" size="small" className="w-full">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1">{getTypeIcon()}</div>
            <div className="flex-1">{renderContent()}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {isUnread && <Badge status="processing" />}
            <Text type="secondary" className="text-xs flex items-center gap-1">
              <RiTimeLine />
              {formatTime(getTimestamp())}
            </Text>
          </div>
        </div>
        <div className="ml-8">
          <Text type="secondary" className="text-xs">
            {getTypeLabel()}
          </Text>
        </div>
      </Space>
    </Card>
  );
}
