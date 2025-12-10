"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card, Space, Typography, Badge, App, Popconfirm, Input } from "antd";
import {
  RiDownloadLine,
  RiShareLine,
  RiCalendarLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiEditLine,
  RiCheckboxCircleLine,
} from "react-icons/ri";
import { formatDateDDMMYYYY, formatRelativeTime } from "@/utils/date";
import Button from "@/components/ui/Button";
import QRCodeSVG from "./QRCodeSVGWrapper";

const { Text } = Typography;

export default function ActiveLinkCard({
  qrCode,
  organizationId,
  onDelete,
  deleting = false,
  onUpdateIdentifier,
}) {
  const t = useTranslations();
  const { message } = App.useApp();
  const [imageCopied, setImageCopied] = useState(false);
  const [isEditingIdentifier, setIsEditingIdentifier] = useState(false);
  const [identifierValue, setIdentifierValue] = useState(
    qrCode?.identifier || ""
  );
  const [updatingIdentifier, setUpdatingIdentifier] = useState(false);

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
        message.error(t("qrCodes.card.errors.notAvailableDownload"));
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
      // Use identifier in filename if available, otherwise use ID
      const filename = qrCode?.identifier
        ? `qr-code-${qrCode.identifier.replace(/\s+/g, "-").toLowerCase()}.png`
        : `qr-code-${qrCode.id}.png`;
      downloadLink.download = filename;
      downloadLink.href = url;
      downloadLink.click();
      URL.revokeObjectURL(url);
      message.success(t("qrCodes.card.success.downloaded"));
    } catch (error) {
      console.error("Error downloading QR code:", error);
      message.error(t("qrCodes.card.errors.downloadError"));
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
            // Space for identifier text below QR code
            const identifierHeight = qrCode?.identifier ? 50 : 0;
            const identifierPadding = qrCode?.identifier ? 20 : 0;

            // Create a new canvas with padding, border, and space for identifier
            const canvas = document.createElement("canvas");
            canvas.width = img.width + totalPadding * 2;
            canvas.height =
              img.height +
              totalPadding * 2 +
              identifierHeight +
              identifierPadding;
            const ctx = canvas.getContext("2d");

            if (!ctx) {
              reject(new Error("Failed to get canvas 2D context"));
              return;
            }

            // Fill with white background
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw border (only around QR code area, not including identifier)
            const qrCodeAreaHeight = img.height + totalPadding * 2;
            ctx.strokeStyle = "#E5E7EB"; // Light gray border
            ctx.lineWidth = borderWidth;
            ctx.strokeRect(
              borderWidth / 2,
              borderWidth / 2,
              canvas.width - borderWidth,
              qrCodeAreaHeight - borderWidth
            );

            // Draw inner border for depth
            ctx.strokeStyle = "#D1D5DB"; // Slightly darker gray
            ctx.lineWidth = 1;
            ctx.strokeRect(
              borderWidth + 2,
              borderWidth + 2,
              canvas.width - (borderWidth + 2) * 2,
              qrCodeAreaHeight - (borderWidth + 2) * 2
            );

            // Draw the QR code image centered with padding
            ctx.drawImage(
              img,
              totalPadding,
              totalPadding,
              img.width,
              img.height
            );

            // Draw identifier text below QR code if it exists
            if (qrCode?.identifier) {
              const textY = qrCodeAreaHeight + identifierPadding;
              const textX = canvas.width / 2;

              // Set text style
              ctx.fillStyle = "#1F2937"; // Dark gray text
              ctx.font =
                "bold 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
              ctx.textAlign = "center";
              ctx.textBaseline = "top";

              // Draw text with slight shadow for readability
              ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
              ctx.shadowBlur = 4;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 1;

              // Draw the identifier text
              ctx.fillText(qrCode.identifier, textX, textY);

              // Reset shadow
              ctx.shadowColor = "transparent";
              ctx.shadowBlur = 0;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;
            }

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
      message.success(t("qrCodes.card.success.copied"));
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
        message.error(t("qrCodes.card.errors.notAvailableShare"));
        return;
      }

      // Convert SVG to blob
      let blob;
      try {
        blob = await svgToBlob(svg);
      } catch (error) {
        console.error("Error converting SVG to blob:", error);
        message.error(t("qrCodes.activeLinkCard.processingError"));
        return;
      }

      // Add styling to the QR code (with error handling)
      let styledBlob;
      let styledFile;
      const filename = qrCode?.identifier
        ? `qr-code-${qrCode.identifier.replace(/\s+/g, "-").toLowerCase()}.png`
        : `qr-code-${qrCode.id}.png`;
      try {
        styledBlob = await addStylingToQRCode(blob);
        styledFile = new File([styledBlob], filename, {
          type: "image/png",
        });
      } catch (error) {
        console.error("Error styling QR code:", error);
        // If styling fails, use original blob
        styledBlob = blob;
        styledFile = new File([blob], filename, {
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
            title: t("qrCodes.card.share.title"),
            text: t("qrCodes.card.share.text"),
            files: [styledFile],
          });
          message.success(t("qrCodes.card.success.shared"));
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
            title: t("qrCodes.card.share.title"),
            text: t("qrCodes.card.share.text"),
            url: link,
          });
          message.success(t("qrCodes.card.success.shared"));
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
      message.info(t("qrCodes.card.success.downloaded"));
      handleDownload();
    } catch (error) {
      console.error("Error sharing QR code:", error);
      message.error(t("qrCodes.card.errors.shareError"));
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

  const handleIdentifierSave = async () => {
    if (!onUpdateIdentifier) return;

    const trimmedValue = identifierValue.trim();
    if (trimmedValue === (qrCode?.identifier || "")) {
      setIsEditingIdentifier(false);
      return;
    }

    setUpdatingIdentifier(true);
    try {
      await onUpdateIdentifier(qrCode.id, trimmedValue);
      setIsEditingIdentifier(false);
    } catch (error) {
      console.error("Error updating identifier:", error);
      message.error(t("resident.view.identifierUpdateError"));
    } finally {
      setUpdatingIdentifier(false);
    }
  };

  const handleIdentifierCancel = () => {
    setIdentifierValue(qrCode?.identifier || "");
    setIsEditingIdentifier(false);
  };

  // Don't render if we don't have required data
  if (!qrCode || !qrCode.id || !qrCode.token) {
    return null;
  }

  // Always render QR code if token exists - it will work with relative path too
  return (
    <Card className="w-full" hoverable>
      <div className="flex flex-col gap-4 w-full">
        {/* Identifier Display/Edit */}
        <div className="w-full">
          {isEditingIdentifier ? (
            <div className="flex items-center gap-2">
              <Input
                value={identifierValue}
                onChange={(e) => setIdentifierValue(e.target.value)}
                onPressEnter={handleIdentifierSave}
                onBlur={handleIdentifierSave}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    handleIdentifierCancel();
                  }
                }}
                placeholder={t("qrCodes.activeLinkCard.identifierPlaceholder")}
                maxLength={100}
                disabled={updatingIdentifier}
                autoFocus
                className="flex-1"
              />
              <Button
                type="text"
                icon={<RiCheckLine />}
                onClick={handleIdentifierSave}
                loading={updatingIdentifier}
                size="small"
              />
              <Button
                type="text"
                icon={<RiDeleteBinLine />}
                onClick={handleIdentifierCancel}
                disabled={updatingIdentifier}
                size="small"
              />
            </div>
          ) : (
            <div
              className="flex items-center gap-2 cursor-pointer group hover:bg-gray-50 p-2 rounded transition-colors"
              onClick={() => setIsEditingIdentifier(true)}
              title={t("qrCodes.activeLinkCard.editTooltip")}
            >
              <Text strong className="text-base break-words flex-1">
                {qrCode?.identifier || t("organizations.pendingCodes.labels.noIdentifier")}
              </Text>
              <RiEditLine className="text-gray-400 flex-shrink-0 text-sm" />
            </div>
          )}
        </div>

        {/* Arrival Notification - Show when QR code is validated */}
        {qrCode?.is_used === true && qrCode?.validated_at && (
          <div className="w-full p-3 bg-green-50 border border-green-200 rounded-lg">
            <Space orientation="vertical" size="small" className="w-full">
              <div className="flex items-center gap-2">
                <RiCheckboxCircleLine className="text-green-500 text-xl flex-shrink-0" />
                <Text strong className="text-green-700 text-sm">
                  {qrCode?.visitor_name
                    ? t("qrCodes.historyLinkCard.visitorArrived", { name: qrCode.visitor_name })
                    : t("qrCodes.historyLinkCard.visitorArrivedGeneric")}
                </Text>
              </div>
              <div className="flex items-center gap-2 pl-7">
                <RiCalendarLine className="text-green-600 text-sm flex-shrink-0" />
                <Text className="text-green-600 text-xs">
                  {formatRelativeTime(qrCode.validated_at)}
                </Text>
              </div>
            </Space>
          </div>
        )}

        {/* QR Code Display */}
        <div className="flex flex-col items-center p-3 bg-white rounded-lg border-2 border-dashed border-gray-300 w-full overflow-hidden">
          {qrCodeValue ? (
            <div className="flex flex-col items-center gap-2">
              <QRCodeSVG
                id={`qr-code-active-${qrCode.id}`}
                value={qrCodeValue}
                size={200}
                level="H"
                className="max-w-full h-auto"
              />
              {qrCode?.identifier && (
                <Text
                  strong
                  className="text-sm text-center px-2 break-words"
                  style={{ maxWidth: "200px" }}
                >
                  {qrCode.identifier}
                </Text>
              )}
            </div>
          ) : (
            <div className="w-[200px] h-[200px] flex items-center justify-center max-w-full">
              <Text type="secondary" className="break-words text-center px-2">
                {t("common.loading")}
              </Text>
            </div>
          )}
        </div>

        {/* Status and Expiration */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Badge status="success" text={t("qrCodes.card.statuses.active")} className="flex-shrink-0" />
          {timeUntilExpiration && (
            <Text type="secondary" className="text-xs break-words">
              {t("qrCodes.card.expiresAt")} {timeUntilExpiration}
            </Text>
          )}
        </div>

        {/* Expiration Date */}
        {qrCode.expires_at && (
          <div className="flex items-center gap-2 flex-wrap">
            <RiCalendarLine className="text-gray-400 flex-shrink-0" />
            <Text type="secondary" className="text-xs break-words">
              {t("qrCodes.card.expiresAt")}: {formatDateDDMMYYYY(qrCode.expires_at)}
            </Text>
          </div>
        )}

        {/* Actions */}
        <div className="w-full space-y-2">
          {/* Mobile: Stack vertically, Desktop: Share and Download side by side */}
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              type="primary"
              icon={imageCopied ? <RiCheckLine /> : <RiShareLine />}
              onClick={handleShare}
              className="w-full sm:flex-1 min-w-0"
              size="small"
            >
              <span className="truncate">
                {imageCopied ? t("qrCodes.activeLinkCard.copiedButton") : t("qrCodes.activeLinkCard.shareButton")}
              </span>
            </Button>
            <Button
              type="default"
              icon={<RiDownloadLine />}
              onClick={handleDownload}
              className="w-full sm:flex-1 min-w-0"
              size="small"
            >
              <span className="truncate">{t("qrCodes.card.downloadQR")}</span>
            </Button>
          </div>
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
              type="default"
              danger
              icon={<RiDeleteBinLine />}
              className="w-full"
              size="small"
              loading={deleting}
              disabled={deleting}
            >
              {t("qrCodes.activeLinkCard.deleteButton")}
            </Button>
          </Popconfirm>
        </div>
      </div>
    </Card>
  );
}
