"use client";

import { useTranslations } from "next-intl";
import { Card, Space, Typography, Badge, App, Popconfirm } from "antd";
import {
  RiCalendarLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiCheckboxCircleLine,
} from "react-icons/ri";
import { formatDateDDMMYYYY, formatRelativeTime } from "@/utils/date";
import Button from "@/components/ui/Button";

const { Text } = Typography;

export default function HistoryLinkCard({
  qrCode,
  organizationId,
  onDelete,
  deleting = false,
}) {
  const t = useTranslations();
  const { message } = App.useApp();

  const getStatus = () => {
    const now = new Date();
    const expiresAt = qrCode.expires_at ? new Date(qrCode.expires_at) : null;
    const isExpired = expiresAt && expiresAt <= now;
    const isUsed = qrCode.is_used === true;

    if (isUsed) {
      return { status: "default", text: t("qrCodes.historyLinkCard.statuses.used"), color: "gray" };
    }
    if (isExpired) {
      return { status: "error", text: t("qrCodes.historyLinkCard.statuses.expired"), color: "red" };
    }
    return { status: "default", text: t("qrCodes.historyLinkCard.statuses.inactive"), color: "gray" };
  };

  const statusInfo = getStatus();

  const canDelete = qrCode.is_used === false;

  const handleDelete = async () => {
    if (!onDelete) return;

    const result = await onDelete(qrCode.id);
    if (result.error) {
      message.error(result.message);
    } else {
      message.success(result.message);
    }
  };

  return (
    <Card className="w-full">
      <div className="flex flex-col gap-3">
        {/* Arrival Notification - Show when QR code is validated */}
        {qrCode?.is_used === true && qrCode?.validated_at && (
          <div
            className="w-full p-2 rounded-lg"
            style={{
              backgroundColor: "var(--color-primary-bg)",
              border: "1px solid var(--color-primary)",
            }}
          >
            <Space orientation="vertical" size="small" className="w-full">
              <div className="flex items-center gap-2">
                <RiCheckboxCircleLine
                  className="text-base flex-shrink-0"
                  style={{ color: "var(--color-primary)" }}
                />
                <Text
                  strong
                  className="text-xs"
                  style={{ color: "var(--color-primary)" }}
                >
                  {qrCode.visitor_name 
                    ? t("qrCodes.historyLinkCard.visitorArrived", { name: qrCode.visitor_name })
                    : t("qrCodes.historyLinkCard.visitorArrivedGeneric")}
                </Text>
              </div>
              <div className="flex items-center gap-2 pl-6">
                <RiCalendarLine
                  className="text-xs flex-shrink-0"
                  style={{ color: "var(--color-primary)", opacity: 0.7 }}
                />
                <Text
                  className="text-[10px] italic"
                  style={{ color: "var(--color-primary)", opacity: 0.7 }}
                >
                  {formatRelativeTime(qrCode.validated_at)}
                </Text>
              </div>
            </Space>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Text strong className="truncate">
                {qrCode.identifier || qrCode.token}
              </Text>
              <Badge status={statusInfo.status} text={statusInfo.text} />
            </div>
            {qrCode.validated_at && (
              <div className="flex items-center gap-1">
                <RiCheckLine style={{ color: "var(--color-text-secondary)", opacity: 0.7 }} />
                <Text
                  className="text-[10px] italic"
                  style={{ color: "var(--color-text-secondary)", opacity: 0.7 }}
                >
                  {t("qrCodes.historyLinkCard.validated")} {formatDateDDMMYYYY(qrCode.validated_at)}
                </Text>
              </div>
            )}
            {qrCode.expires_at && !qrCode.validated_at && (
              <div className="flex items-center gap-1">
                <RiCloseLine style={{ color: "var(--color-text-secondary)", opacity: 0.7 }} />
                <Text
                  className="text-[10px] italic"
                  style={{ color: "var(--color-text-secondary)", opacity: 0.7 }}
                >
                  {t("qrCodes.historyLinkCard.expired")} {formatDateDDMMYYYY(qrCode.expires_at)}
                </Text>
              </div>
            )}
          </div>
        </div>
      </div>
      {canDelete && (
        <div className="mt-3">
          <Popconfirm
            title={t("qrCodes.activeLinkCard.deleteTitle")}
            description={t("qrCodes.activeLinkCard.deleteDescription")}
            onConfirm={handleDelete}
            okText={t("qrCodes.activeLinkCard.deleteButton")}
            cancelText={t("qrCodes.activeLinkCard.cancelButton")}
            okButtonProps={{ danger: true }}
            disabled={deleting}
          >
            <Button
              type="text"
              danger
              icon={<RiDeleteBinLine />}
              loading={deleting}
              disabled={deleting}
            >
              {t("qrCodes.activeLinkCard.deleteButton")}
            </Button>
          </Popconfirm>
        </div>
      )}
    </Card>
  );
}
