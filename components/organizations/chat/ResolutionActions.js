"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Modal, Input, App, Space } from "antd";
import { RiCheckLine, RiArchiveLine } from "react-icons/ri";

const { TextArea } = Input;

export default function ResolutionActions({
  conversation,
  organizationId,
  currentUserId,
  onUpdate,
}) {
  const t = useTranslations();
  const { message } = App.useApp();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestResolution = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/organizations/${organizationId}/chat/conversations/${conversation.id}/resolve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resolutionNote: resolutionNote.trim() || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.message || "Error al solicitar la resolución");
      }

      message.success("Solicitud de resolución enviada exitosamente.");
      setShowRequestModal(false);
      setResolutionNote("");
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error requesting resolution:", error);
      message.error(error.message || "Error al solicitar la resolución");
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/organizations/${organizationId}/chat/conversations/${conversation.id}/archive`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.message || "Error al archivar la conversación");
      }

      message.success("Conversación archivada exitosamente.");
      setShowArchiveModal(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error archiving conversation:", error);
      message.error(error.message || "Error al archivar la conversación");
    } finally {
      setLoading(false);
    }
  };

  // Only show actions for role conversations
  if (conversation.type !== "role") {
    return null;
  }

  // Show request resolution button for active conversations
  if (conversation.status === "active") {
    return (
      <>
        <Button
          type="default"
          size="small"
          icon={<RiCheckLine />}
          onClick={() => setShowRequestModal(true)}
        >
          Marcar como Resuelta
        </Button>
        <Modal
          title="Solicitar Resolución"
          open={showRequestModal}
          onOk={handleRequestResolution}
          onCancel={() => {
            setShowRequestModal(false);
            setResolutionNote("");
          }}
          confirmLoading={loading}
          okText="Enviar Solicitud"
          cancelText="Cancelar"
        >
          <Space orientation="vertical" className="w-full">
            <p>
              ¿Estás seguro de que deseas marcar esta conversación como resuelta?
              La otra parte deberá aprobar tu solicitud.
            </p>
            <TextArea
              placeholder="Nota opcional (ej: problema resuelto, caso cerrado, etc.)"
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              rows={3}
              maxLength={500}
              showCount
            />
          </Space>
        </Modal>
      </>
    );
  }

  // Show archive button for resolved conversations
  if (conversation.status === "resolved") {
    return (
      <>
        <Button
          type="default"
          size="small"
          icon={<RiArchiveLine />}
          onClick={() => setShowArchiveModal(true)}
        >
          Archivar
        </Button>
        <Modal
          title="Archivar Conversación"
          open={showArchiveModal}
          onOk={handleArchive}
          onCancel={() => setShowArchiveModal(false)}
          confirmLoading={loading}
          okText="Archivar"
          cancelText="Cancelar"
        >
          <p>
            ¿Estás seguro de que deseas archivar esta conversación? Podrás
            acceder a ella más tarde desde las conversaciones archivadas.
          </p>
        </Modal>
      </>
    );
  }

  return null;
}



