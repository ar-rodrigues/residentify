"use client";

import { useState, useMemo } from "react";
import { Card, Space, Typography, Badge, Modal, App, Popconfirm } from "antd";
import {
  RiQrCodeLine,
  RiCalendarLine,
  RiCheckLine,
  RiCloseLine,
  RiEyeLine,
  RiDeleteBinLine,
} from "react-icons/ri";
import { formatDateDDMMYYYY } from "@/utils/date";
import Button from "@/components/ui/Button";
import QRCodeLinkCard from "./QRCodeLinkCard";

const { Text } = Typography;

export default function HistoryLinkCard({ qrCode, organizationId, onDelete, deleting = false }) {
  const { message } = App.useApp();
  const [detailsVisible, setDetailsVisible] = useState(false);

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
  
  // Generate link safely for SSR
  const link = useMemo(() => {
    if (!qrCode?.token || !organizationId) return '';
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}/organizations/${organizationId}/validate/${qrCode.token}`;
    }
    return `/organizations/${organizationId}/validate/${qrCode.token}`;
  }, [qrCode?.token, organizationId]);

  const canDelete = qrCode.is_used === false;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!onDelete) return;
    
    const result = await onDelete(qrCode.id);
    if (result.error) {
      message.error(result.message);
    } else {
      message.success(result.message);
    }
  };

  return (
    <>
      <Card
        className="w-full"
        hoverable
        onClick={() => setDetailsVisible(true)}
      >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <RiQrCodeLine className="text-xl text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Text strong className="truncate">
                    {qrCode.identifier || qrCode.token}
                  </Text>
                  <Badge status={statusInfo.status} text={statusInfo.text} />
                </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <RiCalendarLine />
                  <Text type="secondary">
                    Creado: {formatDateDDMMYYYY(qrCode.created_at)}
                  </Text>
                </div>
                {qrCode.validated_at && (
                  <div className="flex items-center gap-1">
                    <RiCheckLine />
                    <Text type="secondary">
                      Validado: {formatDateDDMMYYYY(qrCode.validated_at)}
                    </Text>
                  </div>
                )}
                {qrCode.expires_at && !qrCode.validated_at && (
                  <div className="flex items-center gap-1">
                    <RiCloseLine />
                    <Text type="secondary">
                      Expiró: {formatDateDDMMYYYY(qrCode.expires_at)}
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Space>
            {canDelete && (
              <Popconfirm
                title="Eliminar enlace"
                description="¿Estás seguro de que deseas eliminar este enlace? Esta acción no se puede deshacer."
                onConfirm={handleDelete}
                okText="Eliminar"
                cancelText="Cancelar"
                okButtonProps={{ danger: true }}
                disabled={deleting}
                onCancel={(e) => e?.stopPropagation()}
              >
                <Button
                  type="text"
                  danger
                  icon={<RiDeleteBinLine />}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  loading={deleting}
                  disabled={deleting}
                >
                  Eliminar
                </Button>
              </Popconfirm>
            )}
            <Button
              type="text"
              icon={<RiEyeLine />}
              onClick={(e) => {
                e.stopPropagation();
                setDetailsVisible(true);
              }}
            >
              Ver Detalles
            </Button>
          </Space>
        </div>
      </Card>

      {/* Details Modal */}
      <Modal
        title="Detalles del Enlace"
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={null}
        width={700}
      >
        <QRCodeLinkCard
          qrCode={qrCode}
          onClose={() => setDetailsVisible(false)}
        />
      </Modal>
    </>
  );
}

