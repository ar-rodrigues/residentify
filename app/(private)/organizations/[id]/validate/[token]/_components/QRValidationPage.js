"use client";

import { useState, useEffect } from "react";
import { Card, Space, Typography, Alert, App } from "antd";
import { RiQrCodeLine, RiCheckLine, RiCloseLine } from "react-icons/ri";
import { useQRCodes } from "@/hooks/useQRCodes";
import QRValidationForm from "../../../_components/widgets/residential/QRValidationForm";
import Button from "@/components/ui/Button";
import Link from "next/link";

const { Title, Text } = Typography;

export default function QRValidationPage({ organizationId, token }) {
  const { message } = App.useApp();
  const [qrCode, setQrCode] = useState(null);
  const [error, setError] = useState(null);
  const [validated, setValidated] = useState(false);
  const { getQRCodeByToken, validateQRCode, loading } = useQRCodes();

  useEffect(() => {
    loadQRCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadQRCode = async () => {
    const result = await getQRCodeByToken(token);
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
      setValidated(true);
      // Reload QR code to get updated status
      await loadQRCode();
    }
  };

  if (loading && !qrCode) {
    return (
      <Card>
        <div className="flex justify-center items-center py-12">
          <Text>Cargando...</Text>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Space orientation="vertical" size="large" className="w-full">
          <Alert
            title="Error"
            description={error}
            type="error"
            showIcon
          />
          <Link href={`/organizations/${organizationId}`} className="block w-full">
            <Button type="primary" className="w-full">
              Volver a la Organización
            </Button>
          </Link>
        </Space>
      </Card>
    );
  }

  if (validated || (qrCode && qrCode.is_used)) {
    return (
      <Card>
        <Space orientation="vertical" size="large" className="w-full text-center">
          <RiCheckLine className="text-6xl text-green-500 mx-auto" />
          <Title level={3}>Código QR Validado Exitosamente</Title>
          <Text type="secondary">
            El acceso ha sido registrado y el código QR ha sido marcado como usado.
          </Text>
          <Link href={`/organizations/${organizationId}`} className="block w-full">
            <Button type="primary" className="w-full">
              Volver a la Organización
            </Button>
          </Link>
        </Space>
      </Card>
    );
  }

  return (
    <Card>
      <Space orientation="vertical" size="large" className="w-full">
        {qrCode && (
          <div className="border-b pb-4">
            <Space>
              <RiQrCodeLine className="text-2xl text-blue-500" />
              <div>
                <Title level={4} className="mb-0">Código QR Encontrado</Title>
                <Text type="secondary">Token: {qrCode.token}</Text>
              </div>
            </Space>
          </div>
        )}

        {qrCode && !qrCode.is_used && (
          <QRValidationForm
            qrCode={qrCode}
            onSubmit={handleValidation}
            onCancel={() => window.history.back()}
            loading={loading}
          />
        )}
      </Space>
    </Card>
  );
}

