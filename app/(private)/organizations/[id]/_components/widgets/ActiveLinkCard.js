"use client";

import { useState, useMemo } from "react";
import { Card, Space, Typography, Badge, App, Popconfirm } from "antd";
import {
  RiDownloadLine,
  RiShareLine,
  RiCalendarLine,
  RiCheckLine,
  RiDeleteBinLine,
} from "react-icons/ri";
import { formatDateDDMMYYYY } from "@/utils/date";
import Button from "@/components/ui/Button";
import QRCodeSVG from "./QRCodeSVGWrapper";

const { Text } = Typography;

export default function ActiveLinkCard({
  qrCode,
  organizationId,
  onDelete,
  deleting = false,
}) {
  const { message } = App.useApp();
  const [imageCopied, setImageCopied] = useState(false);

  // Generate link - always provide a valid value for QR code
  const link = useMemo(() => {
    if (!qrCode?.token || !organizationId) return "";
    if (typeof window !== "undefined" && window.location?.origin) {
      return `${window.location.origin}/organizations/${organizationId}/validate/${qrCode.token}`;
    }
    // Fallback for SSR - use relative path
    return `/organizations/${organizationId}/validate/${qrCode.token}`;
  }, [qrCode?.token, organizationId]);

  // QR code value - always set if token exists
  const qrCodeValue = useMemo(() => {
    if (!qrCode?.token || !organizationId) return "";
    // Use full URL when available, otherwise use relative path
    if (typeof window !== "undefined" && window.location?.origin) {
      return `${window.location.origin}/organizations/${organizationId}/validate/${qrCode.token}`;
    }
    return `/organizations/${organizationId}/validate/${qrCode.token}`;
  }, [qrCode?.token, organizationId]);

  // Helper function to convert SVG to PNG Blob
  const svgToBlob = async (svgElement) => {
    return new Promise((resolve, reject) => {
      try {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get canvas 2D context"));
          return;
        }

        const img = new Image();

        img.onload = () => {
          try {
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
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => reject(new Error("Failed to load image"));
        img.src =
          "data:image/svg+xml;base64," +
          btoa(unescape(encodeURIComponent(svgData)));
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleDownload = async () => {
    try {
      const svg = document.getElementById(`qr-code-active-${qrCode.id}`);
      if (!svg) {
        message.error("El código QR no está disponible para descargar");
        return;
      }

      // Convert SVG to blob
      const blob = await svgToBlob(svg);

      // Add styling to the QR code
      let styledBlob;
      try {
        styledBlob = await addStylingToQRCode(blob);
      } catch (error) {
        console.error("Error styling QR code for download:", error);
        // If styling fails, use original blob
        styledBlob = blob;
      }

      const url = URL.createObjectURL(styledBlob);
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

  // Helper function to add styling (borders, padding) to QR code image
  const addStylingToQRCode = async (blob) => {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        const objectUrl = URL.createObjectURL(blob);

        img.onload = () => {
          try {
            // Clean up object URL
            URL.revokeObjectURL(objectUrl);

            // Padding around the QR code (in pixels)
            const padding = 40;
            // Border width
            const borderWidth = 4;
            // Total padding including border
            const totalPadding = padding + borderWidth;

            // Create a new canvas with padding and border
            const canvas = document.createElement("canvas");
            canvas.width = img.width + totalPadding * 2;
            canvas.height = img.height + totalPadding * 2;
            const ctx = canvas.getContext("2d");

            if (!ctx) {
              reject(new Error("Failed to get canvas 2D context"));
              return;
            }

            // Fill with white background
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw border
            ctx.strokeStyle = "#E5E7EB"; // Light gray border
            ctx.lineWidth = borderWidth;
            ctx.strokeRect(
              borderWidth / 2,
              borderWidth / 2,
              canvas.width - borderWidth,
              canvas.height - borderWidth
            );

            // Draw inner border for depth
            ctx.strokeStyle = "#D1D5DB"; // Slightly darker gray
            ctx.lineWidth = 1;
            ctx.strokeRect(
              borderWidth + 2,
              borderWidth + 2,
              canvas.width - (borderWidth + 2) * 2,
              canvas.height - (borderWidth + 2) * 2
            );

            // Draw the QR code image centered with padding
            ctx.drawImage(
              img,
              totalPadding,
              totalPadding,
              img.width,
              img.height
            );

            // Convert to blob
            canvas.toBlob((styledBlob) => {
              if (styledBlob) {
                resolve(styledBlob);
              } else {
                reject(new Error("Failed to create styled blob"));
              }
            }, "image/png");
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Failed to load image"));
        };
        img.src = objectUrl;
      } catch (error) {
        reject(error);
      }
    });
  };

  // Helper function to copy image to clipboard
  const handleShareToClipboard = async (styledBlob) => {
    try {
      // Check if Clipboard API is available
      if (
        !navigator.clipboard ||
        !navigator.clipboard.write ||
        !window.ClipboardItem
      ) {
        // Clipboard API not supported, return false gracefully
        return false;
      }

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": styledBlob }),
      ]);
      setImageCopied(true);
      message.success("Imagen del código QR copiada al portapapeles");
      setTimeout(() => setImageCopied(false), 2000);
      return true;
    } catch (error) {
      // Silently fail and let fallback methods handle it
      console.error("Error copying image to clipboard:", error);
      return false;
    }
  };

  const handleShare = async () => {
    try {
      const svg = document.getElementById(`qr-code-active-${qrCode.id}`);
      if (!svg) {
        message.error("El código QR no está disponible para compartir");
        return;
      }

      // Convert SVG to blob
      let blob;
      try {
        blob = await svgToBlob(svg);
      } catch (error) {
        console.error("Error converting SVG to blob:", error);
        message.error("Error al procesar el código QR");
        return;
      }

      // Add styling to the QR code (with error handling)
      let styledBlob;
      let styledFile;
      try {
        styledBlob = await addStylingToQRCode(blob);
        styledFile = new File([styledBlob], `qr-code-${qrCode.id}.png`, {
          type: "image/png",
        });
      } catch (error) {
        console.error("Error styling QR code:", error);
        // If styling fails, use original blob
        styledBlob = blob;
        styledFile = new File([blob], `qr-code-${qrCode.id}.png`, {
          type: "image/png",
        });
      }

      // Tier 1: Try copying image to clipboard (primary method)
      const clipboardSuccess = await handleShareToClipboard(styledBlob);
      if (clipboardSuccess) {
        return;
      }

      // Tier 2: Try Web Share API with files (using styled version)
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [styledFile] })
      ) {
        try {
          await navigator.share({
            title: "Código QR de Validación",
            text: "Comparte este código QR con el visitante",
            files: [styledFile],
          });
          message.success("Código QR compartido exitosamente");
          return;
        } catch (err) {
          if (err.name === "AbortError") {
            // User cancelled, don't try other methods
            return;
          }
          console.error("Error sharing with files:", err);
          // Continue to next tier
        }
      }

      // Tier 3: Try Web Share API with text + URL (more compatible, shares the link)
      if (navigator.share && link) {
        try {
          await navigator.share({
            title: "Código QR de Validación",
            text: "Comparte este código QR con el visitante",
            url: link,
          });
          message.success("Enlace de validación compartido exitosamente");
          return;
        } catch (err) {
          if (err.name === "AbortError") {
            // User cancelled, don't try other methods
            return;
          }
          console.error("Error sharing with text/URL:", err);
          // Continue to next tier
        }
      }

      // Tier 4: Fallback to download (last resort)
      message.info("Compartir no está disponible. Descargando el código QR...");
      handleDownload();
    } catch (error) {
      console.error("Error sharing QR code:", error);
      message.error("Error al compartir el código QR");
      // Final fallback to download
      try {
        handleDownload();
      } catch (downloadError) {
        console.error("Error in download fallback:", downloadError);
      }
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    const result = await onDelete(qrCode.id);
    if (result.error) {
      message.error(result.message);
    } else {
      message.success(result.message);
    }
  };

  const getTimeUntilExpiration = () => {
    if (!qrCode.expires_at) return null;
    const now = new Date();
    const expiresAt = new Date(qrCode.expires_at);
    const diff = expiresAt - now;

    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const timeUntilExpiration = getTimeUntilExpiration();

  // Don't render if we don't have required data
  if (!qrCode || !qrCode.id || !qrCode.token) {
    return null;
  }

  // Always render QR code if token exists - it will work with relative path too
  return (
    <Card className="w-full" hoverable>
      <Space direction="vertical" size="middle" className="w-full">
        {/* QR Code Display */}
        <div className="flex justify-center p-3 bg-white rounded-lg border-2 border-dashed border-gray-300">
          {qrCodeValue ? (
            <QRCodeSVG
              id={`qr-code-active-${qrCode.id}`}
              value={qrCodeValue}
              size={200}
              level="H"
            />
          ) : (
            <div className="w-[200px] h-[200px] flex items-center justify-center">
              <Text type="secondary">Cargando QR...</Text>
            </div>
          )}
        </div>

        {/* Status and Expiration */}
        <div className="flex items-center justify-between">
          <Badge status="success" text="Activo" />
          {timeUntilExpiration && (
            <Text type="secondary" className="text-xs">
              Expira en {timeUntilExpiration}
            </Text>
          )}
        </div>

        {/* Expiration Date */}
        {qrCode.expires_at && (
          <div className="flex items-center gap-2">
            <RiCalendarLine className="text-gray-400" />
            <Text type="secondary" className="text-xs">
              Expira: {formatDateDDMMYYYY(qrCode.expires_at)}
            </Text>
          </div>
        )}

        {/* Actions */}
        <Space direction="vertical" size="small" className="w-full">
          <Space className="w-full" size="small">
            <Button
              type="default"
              icon={<RiDownloadLine />}
              onClick={handleDownload}
              className="flex-1"
              size="small"
            >
              Descargar QR
            </Button>
            <Button
              type="primary"
              icon={imageCopied ? <RiCheckLine /> : <RiShareLine />}
              onClick={handleShare}
              className="flex-1"
              size="small"
            >
              {imageCopied ? "Copiado" : "Compartir"}
            </Button>
          </Space>
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
              type="default"
              danger
              icon={<RiDeleteBinLine />}
              className="w-full"
              size="small"
              loading={deleting}
              disabled={deleting}
            >
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      </Space>
    </Card>
  );
}
