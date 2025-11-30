"use client";

import { useState } from "react";
import { Card, Typography, Space, Alert, App, Tabs } from "antd";
import {
  RiQrScanLine,
  RiCheckLine,
  RiCloseLine,
  RiHistoryLine,
  RiFileListLine,
} from "react-icons/ri";
import QRValidationForm from "../widgets/QRValidationForm";
import QRScanner from "../widgets/QRScanner";
import PendingCodesList from "../widgets/PendingCodesList";
import AccessHistoryList from "../widgets/AccessHistoryList";
import { useQRCodes } from "@/hooks/useQRCodes";
import Button from "@/components/ui/Button";

const { Title, Text } = Typography;

export default function SecurityView({ organizationId }) {
  const { message } = App.useApp();
  const [qrCode, setQrCode] = useState(null);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { getQRCodeByToken, validateQRCode, loading } = useQRCodes();

  const handleScan = async (scannedToken) => {
    setError(null);
    setQrCode(null);

    const result = await getQRCodeByToken(scannedToken);
    if (result.error) {
      setError(result.message);
      setQrCode(null);
    } else {
      setQrCode(result.data);
      setError(null);
    }
  };

  const handleValidation = async (formData) => {
    if (!qrCode) return;

    const result = await validateQRCode(qrCode.token, formData);
    if (result.error) {
      message.error(result.message);
    } else {
      message.success(result.message);
      // Reset form and refresh pending codes
      setQrCode(null);
      setError(null);
      setRefreshKey((prev) => prev + 1);
    }
  };

  const handleReset = () => {
    setQrCode(null);
    setError(null);
  };

  const tabItems = [
    {
      key: "validate",
      label: (
        <Space>
          <RiQrScanLine />
          <span>Validar</span>
        </Space>
      ),
      children: (
        <div className="w-full">
          <Space direction="vertical" size="large" className="w-full">
            <div>
              <Title level={4} className="mb-2">
                Validar Código QR
              </Title>
              <Text type="secondary">
                Escanea o ingresa el token del código QR para validar el acceso
                del visitante
              </Text>
            </div>

            {/* QR Scanner */}
            <QRScanner onScan={handleScan} loading={loading} />

            {/* Error Display */}
            {error && (
              <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
                closable
                onClose={() => setError(null)}
              />
            )}

            {/* QR Code Info */}
            {qrCode && !error && (
              <Card
                title={
                  <Space>
                    <RiCheckLine className="text-green-500" />
                    <span>Código QR Encontrado</span>
                  </Space>
                }
                extra={
                  <Button
                    type="text"
                    icon={<RiCloseLine />}
                    onClick={handleReset}
                  >
                    Limpiar
                  </Button>
                }
              >
                <Space direction="vertical" size="middle" className="w-full">
                  <div>
                    <Text strong>Token: </Text>
                    <Text code>{qrCode.token}</Text>
                  </div>
                  <div>
                    <Text strong>Estado: </Text>
                    <Text>
                      {qrCode.is_used
                        ? "Usado"
                        : qrCode.status === "active"
                        ? "Activo"
                        : qrCode.status}
                    </Text>
                  </div>
                  {qrCode.expires_at && (
                    <div>
                      <Text strong>Expira: </Text>
                      <Text>
                        {new Date(qrCode.expires_at).toLocaleString("es-ES")}
                      </Text>
                    </div>
                  )}
                </Space>
              </Card>
            )}

            {/* Validation Form */}
            {qrCode && !error && !qrCode.is_used && (
              <Card title="Información del Visitante">
                <QRValidationForm
                  qrCode={qrCode}
                  onSubmit={handleValidation}
                  onCancel={handleReset}
                  loading={loading}
                />
              </Card>
            )}

            {/* Already Used Message */}
            {qrCode && !error && qrCode.is_used && (
              <Alert
                message="Código ya utilizado"
                description="Este código QR ya ha sido validado y utilizado anteriormente."
                type="warning"
                showIcon
              />
            )}
          </Space>
        </div>
      ),
    },
    {
      key: "history",
      label: (
        <Space>
          <RiHistoryLine />
          <span>Historial</span>
        </Space>
      ),
      children: <AccessHistoryList organizationId={organizationId} />,
    },
    {
      key: "pending",
      label: (
        <Space>
          <RiFileListLine />
          <span>Pendientes</span>
        </Space>
      ),
      children: (
        <PendingCodesList
          organizationId={organizationId}
          onRefresh={refreshKey}
        />
      ),
    },
  ];

  return (
    <div className="w-full">
      <Card className="w-full">
        <Tabs defaultActiveKey="validate" items={tabItems} />
      </Card>
    </div>
  );
}
