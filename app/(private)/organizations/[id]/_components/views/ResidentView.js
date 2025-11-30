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
import { RiQrCodeLine, RiHistoryLine } from "react-icons/ri";
import { useQRCodes } from "@/hooks/useQRCodes";
import ActiveLinkCard from "../widgets/ActiveLinkCard";
import HistoryLinkCard from "../widgets/HistoryLinkCard";
import GenerateInviteFAB from "../widgets/GenerateInviteFAB";

const { Title, Text } = Typography;

export default function ResidentView({ organizationId }) {
  const { message } = App.useApp();
  const {
    createQRCode,
    getQRCodes,
    deleteQRCode,
    updateQRCode,
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

  const handleGenerateInvite = async () => {
    const result = await createQRCode(organizationId);
    if (!result.error) {
      // Refresh QR codes list to display the new QR code
      await loadQRCodes();
      message.success("Invitación generada exitosamente");
    } else {
      message.error(
        result.message || "Error al generar la invitación"
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
    <div className="w-full">
      <Card className="w-full">
        <Space direction="vertical" size="large" className="w-full">
          <div>
            <Title level={4} className="mb-2 break-words">
              Invitaciones
            </Title>
            <Text type="secondary" className="break-words block">
              Genera invitaciones únicas para que el personal de seguridad valide el
              acceso de visitantes
            </Text>
          </div>

          {/* Active Invites Section */}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <RiQrCodeLine className="text-xl text-blue-500 flex-shrink-0" />
              <Title level={5} className="mb-0 break-words">
                Invitaciones Activas
              </Title>
              {activeLinks.length > 0 && (
                <Badge count={activeLinks.length} showZero={false} className="flex-shrink-0" />
              )}
            </div>

            {qrLoading ? (
              <div className="flex justify-center items-center py-12">
                <Spin size="large" />
              </div>
            ) : activeLinks.length === 0 ? (
              <Empty
                description="No tienes invitaciones activas"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeLinks.map((qrCode) => (
                  <ActiveLinkCard
                    key={qrCode.id}
                    qrCode={qrCode}
                    organizationId={organizationId}
                    onDelete={handleDeleteQRCode}
                    deleting={qrLoading}
                    onUpdateIdentifier={async (id, identifier) => {
                      const result = await updateQRCode(id, { identifier });
                      if (!result.error) {
                        await loadQRCodes();
                        message.success("Identificador actualizado exitosamente");
                      } else {
                        message.error(
                          result.message || "Error al actualizar el identificador"
                        );
                      }
                    }}
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
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <RiHistoryLine className="text-xl text-gray-500 flex-shrink-0" />
                  <Title level={5} className="mb-0 break-words">
                    Historial
                  </Title>
                  <Badge count={historyLinks.length} showZero={false} className="flex-shrink-0" />
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
      <GenerateInviteFAB
        organizationId={organizationId}
        onClick={handleGenerateInvite}
        loading={qrLoading}
      />
    </div>
  );
}
