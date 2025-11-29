"use client";

import { useState } from "react";
import { Card, Typography, Space, Input, Alert, App } from "antd";
import {
  RiQrScanLine,
  RiSearchLine,
  RiCheckLine,
  RiCloseLine,
} from "react-icons/ri";
import QRValidationForm from "../widgets/QRValidationForm";
import { useQRCodes } from "@/hooks/useQRCodes";
import Button from "@/components/ui/Button";
import InputComponent from "@/components/ui/Input";

const { Title, Paragraph, Text } = Typography;

export default function SecurityView({ organizationId }) {
  const { message } = App.useApp();
  const [token, setToken] = useState("");
  const [qrCode, setQrCode] = useState(null);
  const [error, setError] = useState(null);
  const { getQRCodeByToken, validateQRCode, loading } = useQRCodes();

  const handleTokenSearch = async () => {
    if (!token || token.trim().length === 0) {
      message.warning("Por favor, ingresa un token");
      return;
    }

    setError(null);
    setQrCode(null);

    const result = await getQRCodeByToken(token.trim());
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
      // Reset form
      setToken("");
      setQrCode(null);
      setError(null);
    }
  };

  const handleReset = () => {
    setToken("");
    setQrCode(null);
    setError(null);
  };

  return (
    <div className="w-full">
      <Card className="w-full">
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

          {/* Token Input */}
          <div className="flex gap-2">
            <InputComponent
              prefixIcon={<RiQrScanLine />}
              placeholder="Ingresa o escanea el token del código QR"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onPressEnter={handleTokenSearch}
              size="large"
              className="flex-1"
            />
            <Button
              type="primary"
              icon={<RiSearchLine />}
              onClick={handleTokenSearch}
              loading={loading}
              size="large"
            >
              Buscar
            </Button>
          </div>

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
      </Card>
    </div>
  );
}
