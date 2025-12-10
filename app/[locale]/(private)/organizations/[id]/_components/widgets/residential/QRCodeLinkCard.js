"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations();
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
      return <Badge status="default" text={t("qrCodes.card.statuses.used")} />;
    }
    if (expired) {
      return <Badge status="error" text={t("qrCodes.card.statuses.expired")} />;
    }
    if (status === "active") {
      return <Badge status="success" text={t("qrCodes.card.statuses.active")} />;
    }
    return <Badge status="default" text={status} />;
  };

  const handleCopyLink = async () => {
    if (!link) {
      message.error(t("qrCodes.card.errors.linkNotReady"));
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      message.success(t("qrCodes.card.success.copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error copying to clipboard:", err);
      message.error(t("qrCodes.card.errors.copyError"));
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
        message.error(t("qrCodes.card.errors.notAvailableDownload"));
        return;
      }

      const blob = await svgToBlob(svg);
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.download = `qr-code-${qrCode.id}.png`;
      downloadLink.href = url;
      downloadLink.click();
      URL.revokeObjectURL(url);
      message.success(t("qrCodes.card.success.downloaded"));
    } catch (error) {
      console.error("Error downloading QR code:", error);
      message.error(t("qrCodes.card.errors.downloadError"));
    }
  };

  const handleShare = async () => {
    try {
      const svg = document.getElementById(`qr-code-${qrCode.id}`);
      if (!svg) {
        message.error(t("qrCodes.card.errors.notAvailableShare"));
        return;
      }

      // Convert SVG to blob
      const blob = await svgToBlob(svg);
      const file = new File([blob], `qr-code-${qrCode.id}.png`, { type: "image/png" });

      // Check if Web Share API supports files
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: t("qrCodes.card.share.title"),
            text: t("qrCodes.card.share.text"),
            files: [file],
          });
          message.success(t("qrCodes.card.success.shared"));
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
      message.error(t("qrCodes.card.errors.shareError"));
      // Fallback to download
      handleDownload();
    }
  };

  return (
    <Card
      title={
        <Space>
          <RiQrCodeLine className="text-xl" />
          <span>{t("qrCodes.linkCard.title")}</span>
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
      <Space orientation="vertical" size="large" className="w-full">
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
            {t("qrCodes.linkCard.validationLink")}
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
              {copied ? t("qrCodes.card.copied") : t("qrCodes.linkCard.copy")}
            </Button>
          </div>
        </div>

        {/* QR Code Details */}
        <div className="border-t pt-4">
          <Title level={5} className="mb-4">
            {t("qrCodes.card.details")}
          </Title>
          <Space orientation="vertical" size="middle" className="w-full">
            <div className="flex items-center justify-between">
              <Text strong>{t("qrCodes.card.status")}</Text>
              {getStatusBadge(qrCode.status, qrCode.is_used, qrCode.expires_at)}
            </div>

            <div className="flex items-start gap-3">
              <RiCalendarLine className="text-xl text-gray-500 mt-1" />
              <div className="flex-1">
                <Text strong className="block mb-1">
                  {t("qrCodes.card.expiresAt")}
                </Text>
                <Text>
                  {qrCode.expires_at ? formatDateDDMMYYYY(qrCode.expires_at) : t("qrCodes.card.notSpecified")}
                </Text>
              </div>
            </div>

            {qrCode.validated_at && (
              <div className="flex items-start gap-3">
                <RiCheckLine className="text-xl text-gray-500 mt-1" />
                <div className="flex-1">
                  <Text strong className="block mb-1">
                    {t("qrCodes.card.validatedAt")}
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
          <Space className="w-full" size="middle" orientation="vertical">
            <Button
              type="primary"
              icon={copied ? <RiCheckLine /> : <RiFileCopyLine />}
              onClick={handleCopyLink}
              className="w-full"
            >
              {copied ? t("qrCodes.card.copied") : t("qrCodes.card.copyLink")}
            </Button>
            <Space className="w-full" size="small">
              <Button
                type="default"
                icon={<RiDownloadLine />}
                onClick={handleDownload}
                className="flex-1"
              >
                {t("qrCodes.card.downloadQR")}
              </Button>
              <Button
                type="default"
                icon={<RiShareLine />}
                onClick={handleShare}
                className="flex-1"
              >
                {t("qrCodes.card.shareQR")}
              </Button>
            </Space>
          </Space>
        </div>
      </Space>
    </Card>
  );
}

