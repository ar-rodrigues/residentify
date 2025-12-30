"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, Space, App } from "antd";
import { RiCheckLine, RiCloseLine } from "react-icons/ri";

export default function ResolutionRequestBanner({
  resolutionRequest,
  conversationId,
  organizationId,
  currentUserId,
  onUpdate,
}) {
  const t = useTranslations();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/organizations/${organizationId}/chat/conversations/${conversationId}/resolve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestId: resolutionRequest.id,
            action: "approve",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.message || "Error al aprobar la solicitud");
      }

      message.success("Solicitud de resolución aprobada exitosamente.");
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error approving resolution:", error);
      message.error(error.message || "Error al aprobar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/organizations/${organizationId}/chat/conversations/${conversationId}/resolve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestId: resolutionRequest.id,
            action: "reject",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.message || "Error al rechazar la solicitud");
      }

      message.success("Solicitud de resolución rechazada.");
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error rejecting resolution:", error);
      message.error(error.message || "Error al rechazar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  // Only show banner if this is a pending request and current user is not the requester
  if (
    resolutionRequest.status !== "pending" ||
    resolutionRequest.requested_by === currentUserId
  ) {
    return null;
  }

  return (
    <Alert
      message="Solicitud de Resolución Pendiente"
      description={
        <div>
          <p>
            {resolutionRequest.resolution_note
              ? `Nota: ${resolutionRequest.resolution_note}`
              : "Se ha solicitado marcar esta conversación como resuelta."}
          </p>
          <Space className="mt-2">
            <Button
              type="primary"
              size="small"
              icon={<RiCheckLine />}
              onClick={handleApprove}
              loading={loading}
            >
              Aprobar
            </Button>
            <Button
              size="small"
              icon={<RiCloseLine />}
              onClick={handleReject}
              loading={loading}
            >
              Rechazar
            </Button>
          </Space>
        </div>
      }
      type="info"
      showIcon
      closable
      className="mb-4"
    />
  );
}






