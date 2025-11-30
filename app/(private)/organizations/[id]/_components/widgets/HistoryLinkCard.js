"use client";

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
  const { message } = App.useApp();

  const getStatus = () => {
    const now = new Date();
    const expiresAt = qrCode.expires_at ? new Date(qrCode.expires_at) : null;
    const isExpired = expiresAt && expiresAt <= now;
    const isUsed = qrCode.is_used === true;

    if (isUsed) {
      return { status: "default", text: "Usado", color: "gray" };
    }
    if (isExpired) {
      return { status: "error", text: "Expirado", color: "red" };
    }
    return { status: "default", text: "Inactivo", color: "gray" };
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
          <div className="w-full p-2 bg-green-50 border border-green-200 rounded-lg">
            <Space direction="vertical" size="small" className="w-full">
              <div className="flex items-center gap-2">
                <RiCheckboxCircleLine className="text-green-500 text-base flex-shrink-0" />
                <Text strong className="text-green-700 text-xs">
                  {qrCode.visitor_name || "Visitante"} ha llegado
                </Text>
              </div>
              <div className="flex items-center gap-2 pl-6">
                <RiCalendarLine className="text-green-600 text-xs flex-shrink-0" />
                <Text className="text-green-600 text-xs">
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
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <RiCheckLine />
                <Text type="secondary">
                  Validado: {formatDateDDMMYYYY(qrCode.validated_at)}
                </Text>
              </div>
            )}
            {qrCode.expires_at && !qrCode.validated_at && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <RiCloseLine />
                <Text type="secondary">
                  Expiró: {formatDateDDMMYYYY(qrCode.expires_at)}
                </Text>
              </div>
            )}
          </div>
        </div>
      </div>
      {canDelete && (
        <div className="mt-3">
          <Popconfirm
            title="Eliminar enlace"
            description="¿Estás seguro de que deseas eliminar este enlace? Esta acción no se puede deshacer."
            onConfirm={handleDelete}
            okText="Eliminar"
            cancelText="Cancelar"
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
              Eliminar
            </Button>
          </Popconfirm>
        </div>
      )}
    </Card>
  );
}
