"use client";

import { useState, useMemo } from "react";
import { Card, Space, Typography, Badge, App } from "antd";
import {
  RiQrCodeLine,
  RiDownloadLine,
  RiFileCopyLine,
  RiShareLine,
  RiCalendarLine,
  RiCheckLine,
  RiCloseLine,
} from "react-icons/ri";
import { formatDateDDMMYYYY } from "@/utils/date";
import Button from "@/components/ui/Button";
import QRCodeSVG from "./QRCodeSVGWrapper";

const { Title, Text } = Typography;

export default function QRCodeLinkCard({ qrCode, onClose }) {
  const { message } = App.useApp();
  const [copied, setCopied] = useState(false);

  // Generate link - always provide a valid value for QR code
  const link = useMemo(() => {
    if (!qrCode?.token || !qrCode?.organization_id) return '';
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}/organizations/${qrCode.organization_id}/validate/${qrCode.token}`;
    }
    // Fallback for SSR - use relative path
    return `/organizations/${qrCode.organization_id}/validate/${qrCode.token}`;
  }, [qrCode?.token, qrCode?.organization_id]);

  // QR code value - always set if token exists
  const qrCodeValue = useMemo(() => {
    if (!qrCode?.token || !qrCode?.organization_id) return '';
    // Use full URL when available, otherwise use relative path
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}/organizations/${qrCode.organization_id}/validate/${qrCode.token}`;
    }
    return `/organizations/${qrCode.organization_id}/validate/${qrCode.token}`;
  }, [qrCode?.token, qrCode?.organization_id]);

  const getStatusBadge = (status, isUsed, expiresAt) => {
    const now = new Date();
    const expired = expiresAt && new Date(expiresAt) < now;

    if (isUsed) {
      return <Badge status="default" text="Usado" />;
    }
    if (expired) {
      return <Badge status="error" text="Expirado" />;
    }
    if (status === "active") {
      return <Badge status="success" text="Activo" />;
    }
    return <Badge status="default" text={status} />;
  };

  const handleCopyLink = async () => {
    if (!link) {
      message.error("El enlace aún no está listo");
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      message.success("Enlace copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error copying to clipboard:", err);
      message.error("No se pudo copiar el enlace");
    }
  };

  // Helper function to convert SVG to PNG Blob
  const svgToBlob = async (svgElement) => {
    return new Promise((resolve, reject) => {
      try {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to create blob"));
            }
          }, "image/png");
        };

        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleDownload = async () => {
    try {
      const svg = document.getElementById(`qr-code-${qrCode.id}`);
      if (!svg) {
        message.error("El código QR no está disponible para descargar");
        return;
      }

      const blob = await svgToBlob(svg);
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.download = `qr-code-${qrCode.id}.png`;
      downloadLink.href = url;
      downloadLink.click();
      URL.revokeObjectURL(url);
      message.success("Código QR descargado exitosamente");
    } catch (error) {
      console.error("Error downloading QR code:", error);
      message.error("Error al descargar el código QR");
    }
  };

  const handleShare = async () => {
    try {
      const svg = document.getElementById(`qr-code-${qrCode.id}`);
      if (!svg) {
        message.error("El código QR no está disponible para compartir");
        return;
      }

      // Convert SVG to blob
      const blob = await svgToBlob(svg);
      const file = new File([blob], `qr-code-${qrCode.id}.png`, { type: "image/png" });

      // Check if Web Share API supports files
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: "Código QR de Validación",
            text: "Comparte este código QR con el visitante",
            files: [file],
          });
          message.success("Código QR compartido exitosamente");
        } catch (err) {
          if (err.name !== "AbortError") {
            console.error("Error sharing:", err);
            // Fallback to download
            handleDownload();
          }
        }
      } else {
        // Fallback to download if file sharing is not supported
        handleDownload();
      }
    } catch (error) {
      console.error("Error sharing QR code:", error);
      message.error("Error al compartir el código QR");
      // Fallback to download
      handleDownload();
    }
  };

  return (
    <Card
      title={
        <Space>
          <RiQrCodeLine className="text-xl" />
          <span>Enlace Generado</span>
        </Space>
      }
      extra={
        onClose && (
          <Button
            type="text"
            icon={<RiCloseLine />}
            onClick={onClose}
          />
        )
      }
      className="w-full"
    >
      <Space direction="vertical" size="large" className="w-full">
        {/* QR Code Display */}
        <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <QRCodeSVG
            id={`qr-code-${qrCode.id}`}
            value={qrCodeValue}
            size={256}
            level="H"
          />
        </div>

        {/* Link Display */}
        <div className="border-t pt-4">
          <Title level={5} className="mb-2">
            Enlace de Validación
          </Title>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
            <Text code className="flex-1 text-sm break-all">
              {link}
            </Text>
            <Button
              type="text"
              icon={copied ? <RiCheckLine /> : <RiFileCopyLine />}
              onClick={handleCopyLink}
              size="small"
            >
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
        </div>

        {/* QR Code Details */}
        <div className="border-t pt-4">
          <Title level={5} className="mb-4">
            Detalles del Enlace
          </Title>
          <Space direction="vertical" size="middle" className="w-full">
            <div className="flex items-center justify-between">
              <Text strong>Estado:</Text>
              {getStatusBadge(qrCode.status, qrCode.is_used, qrCode.expires_at)}
            </div>

            <div className="flex items-start gap-3">
              <RiCalendarLine className="text-xl text-gray-500 mt-1" />
              <div className="flex-1">
                <Text strong className="block mb-1">
                  Expira el
                </Text>
                <Text>
                  {qrCode.expires_at ? formatDateDDMMYYYY(qrCode.expires_at) : "No especificado"}
                </Text>
              </div>
            </div>

            {qrCode.validated_at && (
              <div className="flex items-start gap-3">
                <RiCheckLine className="text-xl text-gray-500 mt-1" />
                <div className="flex-1">
                  <Text strong className="block mb-1">
                    Validado el
                  </Text>
                  <Text>
                    {formatDateDDMMYYYY(qrCode.validated_at)}
                  </Text>
                </div>
              </div>
            )}
          </Space>
        </div>

        {/* Actions */}
        <div className="border-t pt-4">
          <Space className="w-full" size="middle" direction="vertical">
            <Button
              type="primary"
              icon={copied ? <RiCheckLine /> : <RiFileCopyLine />}
              onClick={handleCopyLink}
              className="w-full"
            >
              {copied ? "Copiado" : "Copiar Enlace"}
            </Button>
            <Space className="w-full" size="small">
              <Button
                type="default"
                icon={<RiDownloadLine />}
                onClick={handleDownload}
                className="flex-1"
              >
                Descargar QR
              </Button>
              <Button
                type="default"
                icon={<RiShareLine />}
                onClick={handleShare}
                className="flex-1"
              >
                Compartir QR
              </Button>
            </Space>
          </Space>
        </div>
      </Space>
    </Card>
  );
}

