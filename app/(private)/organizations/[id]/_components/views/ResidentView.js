"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  Space,
  Typography,
  Badge,
  Empty,
  Spin,
  Divider,
  App,
} from "antd";
import { RiQrCodeLine, RiAddLine, RiHistoryLine } from "react-icons/ri";
import { useQRCodes } from "@/hooks/useQRCodes";
import Button from "@/components/ui/Button";
import ActiveLinkCard from "../widgets/ActiveLinkCard";
import HistoryLinkCard from "../widgets/HistoryLinkCard";

const { Title, Text } = Typography;

export default function ResidentView({ organizationId }) {
  const { message } = App.useApp();
  const {
    createQRCode,
    getQRCodes,
    deleteQRCode,
    data: qrCodesData,
    loading: qrLoading,
  } = useQRCodes();

  const loadQRCodes = useCallback(async () => {
    await getQRCodes({ organization_id: organizationId });
  }, [organizationId, getQRCodes]);

  useEffect(() => {
    if (organizationId) {
      loadQRCodes();
    }
  }, [organizationId, loadQRCodes]);

  const handleGenerateLink = async () => {
    const result = await createQRCode(organizationId);
    if (!result.error) {
      // Refresh QR codes list to display the new QR code
      await loadQRCodes();
      message.success("Enlace de validación generado exitosamente");
    } else {
      message.error(
        result.message || "Error al generar el enlace de validación"
      );
    }
  };

  const handleDeleteQRCode = useCallback(
    async (id) => {
      const result = await deleteQRCode(id);
      if (!result.error) {
        // Refresh QR codes list after deletion
        await loadQRCodes();
      }
      return result;
    },
    [deleteQRCode, loadQRCodes]
  );

  // Filter active and history links
  const { activeLinks, historyLinks } = useMemo(() => {
    if (!qrCodesData || !Array.isArray(qrCodesData)) {
      return { activeLinks: [], historyLinks: [] };
    }

    const now = new Date();
    const active = [];
    const history = [];

    qrCodesData.forEach((qrCode) => {
      const expiresAt = qrCode.expires_at ? new Date(qrCode.expires_at) : null;
      const isExpired = expiresAt && expiresAt <= now;
      const isUsed = qrCode.is_used === true;
      const isActive = qrCode.status === "active";

      // Active: not used, not expired, and status is active
      if (!isUsed && !isExpired && isActive) {
        active.push(qrCode);
      } else {
        // History: used or expired
        history.push(qrCode);
      }
    });

    // Sort active by creation date (newest first)
    active.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Sort history by most recent activity (validated_at or created_at)
    history.sort((a, b) => {
      const dateA = a.validated_at
        ? new Date(a.validated_at)
        : new Date(a.created_at);
      const dateB = b.validated_at
        ? new Date(b.validated_at)
        : new Date(b.created_at);
      return dateB - dateA;
    });

    return { activeLinks: active, historyLinks: history };
  }, [qrCodesData]);

  return (
    <div className="relative">
      <Card className="w-full">
        <Space direction="vertical" size="large" className="w-full">
          <div>
            <Title level={4} className="mb-2">
              Enlaces de Validación
            </Title>
            <Text type="secondary">
              Genera enlaces únicos para que el personal de seguridad valide el
              acceso de visitantes
            </Text>
          </div>

          {/* Active Links Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <RiQrCodeLine className="text-xl text-blue-500" />
                <Title level={5} className="mb-0">
                  Enlaces Activos
                </Title>
                {activeLinks.length > 0 && (
                  <Badge count={activeLinks.length} showZero={false} />
                )}
              </div>
              <Button
                type="primary"
                icon={<RiAddLine />}
                onClick={handleGenerateLink}
                loading={qrLoading}
              >
                Generar Enlace
              </Button>
            </div>

            {qrLoading ? (
              <div className="flex justify-center items-center py-12">
                <Spin size="large" />
              </div>
            ) : activeLinks.length === 0 ? (
              <Empty
                description="No tienes enlaces activos"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button
                  type="primary"
                  icon={<RiAddLine />}
                  onClick={handleGenerateLink}
                  loading={qrLoading}
                >
                  Generar Primer Enlace
                </Button>
              </Empty>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeLinks.map((qrCode) => (
                  <ActiveLinkCard
                    key={qrCode.id}
                    qrCode={qrCode}
                    organizationId={organizationId}
                    onDelete={handleDeleteQRCode}
                    deleting={qrLoading}
                  />
                ))}
              </div>
            )}
          </div>

          {/* History Section */}
          {historyLinks.length > 0 && (
            <>
              <Divider />
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <RiHistoryLine className="text-xl text-gray-500" />
                  <Title level={5} className="mb-0">
                    Historial
                  </Title>
                  <Badge count={historyLinks.length} showZero={false} />
                </div>

                <div className="space-y-3">
                  {historyLinks.map((qrCode) => (
                    <HistoryLinkCard
                      key={qrCode.id}
                      qrCode={qrCode}
                      organizationId={organizationId}
                      onDelete={handleDeleteQRCode}
                      deleting={qrLoading}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </Space>
      </Card>
    </div>
  );
}
