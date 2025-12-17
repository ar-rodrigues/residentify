"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
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
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/utils/supabase/client";
import ActiveLinkCard from "../_components/widgets/residential/ActiveLinkCard";
import HistoryLinkCard from "../_components/widgets/residential/HistoryLinkCard";
import GenerateInviteFAB from "../_components/widgets/residential/GenerateInviteFAB";

const { Title, Text } = Typography;

export default function InvitesPageClient({ organizationId }) {
  const t = useTranslations();
  const { message } = App.useApp();
  const { data: user } = useUser();
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef(null);

  const {
    createQRCode,
    getQRCodes,
    deleteQRCode,
    updateQRCode,
    data: qrCodesData,
    loading: qrLoading,
  } = useQRCodes();

  const loadQRCodes = useCallback(async () => {
    if (!organizationId) return;
    await getQRCodes({ organization_id: organizationId });
  }, [organizationId, getQRCodes]);

  useEffect(() => {
    if (organizationId) {
      loadQRCodes();
    }
  }, [organizationId, loadQRCodes]);

  // Set up realtime subscription for QR code updates
  useEffect(() => {
    if (!user?.id || !organizationId) {
      return;
    }

    const channelName = `qr-codes-updates-${organizationId}-${user.id}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "qr_codes",
          filter: `created_by=eq.${user.id}`,
        },
        (payload) => {
          const newRecord = payload.new;
          const oldRecord = payload.old;

          const wasJustValidated =
            (newRecord.is_used === true && oldRecord.is_used === false) ||
            (newRecord.validated_at && !oldRecord.validated_at);

          if (wasJustValidated) {
            if (newRecord.visitor_name) {
              message.success(
                t("resident.view.visitorArrived", {
                  name: newRecord.visitor_name,
                }),
                3
              );
            } else {
              message.success(t("resident.view.visitorArrivedGeneric"), 3);
            }
            loadQRCodes();
          } else {
            loadQRCodes();
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, organizationId, supabase, loadQRCodes, message, t]);

  const handleGenerateInvite = async () => {
    if (!organizationId) return;
    const result = await createQRCode(organizationId);
    if (!result.error) {
      await loadQRCodes();
      message.success(t("resident.view.invitationGenerated"));
    } else {
      message.error(result.message || t("resident.view.invitationError"));
    }
  };

  const handleDeleteQRCode = useCallback(
    async (id) => {
      const result = await deleteQRCode(id);
      if (!result.error) {
        await loadQRCodes();
      }
      return result;
    },
    [deleteQRCode, loadQRCodes]
  );

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

      if (!isUsed && !isExpired && isActive) {
        active.push(qrCode);
      } else {
        history.push(qrCode);
      }
    });

    active.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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
        <Space orientation="vertical" size="large" className="w-full">
          <div>
            <Title level={4} className="mb-2 break-words">
              {t("resident.view.title")}
            </Title>
            <Text type="secondary" className="break-words block">
              {t("resident.view.subtitle")}
            </Text>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <RiQrCodeLine className="text-xl text-blue-500 flex-shrink-0" />
              <Title level={5} className="mb-0 break-words">
                {t("resident.view.activeInvites")}
              </Title>
              {activeLinks.length > 0 && (
                <Badge
                  count={activeLinks.length}
                  showZero={false}
                  className="flex-shrink-0"
                />
              )}
            </div>

            {qrLoading ? (
              <div className="flex justify-center items-center py-12">
                <Spin size="large" />
              </div>
            ) : activeLinks.length === 0 ? (
              <Empty
                description={t("resident.view.noActiveInvites")}
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
                        message.success(t("resident.view.identifierUpdated"));
                      } else {
                        message.error(
                          result.message ||
                            t("resident.view.identifierUpdateError")
                        );
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {historyLinks.length > 0 && (
            <>
              <Divider />
              <div>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <RiHistoryLine className="text-xl text-gray-500 flex-shrink-0" />
                  <Title level={5} className="mb-0 break-words">
                    {t("resident.view.history")}
                  </Title>
                  <Badge
                    count={historyLinks.length}
                    showZero={false}
                    className="flex-shrink-0"
                  />
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



