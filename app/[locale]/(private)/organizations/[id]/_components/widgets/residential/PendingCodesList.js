"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Typography, Space, Empty, Spin, App } from "antd";
import {
  RiQrCodeLine,
  RiUserLine,
  RiTimeLine,
  RiCalendarLine,
} from "react-icons/ri";
import { useQRCodes } from "@/hooks/useQRCodes";

const { Text, Title } = Typography;

export default function PendingCodesList({ organizationId, onRefresh }) {
  const { message } = App.useApp();
  const [pendingCodes, setPendingCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPendingCodes = useCallback(async () => {
    if (!organizationId) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        organization_id: organizationId,
        role: "security",
      });

      const response = await fetch(`/api/qr-codes?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Error al obtener los códigos QR pendientes."
        );
      }

      if (result.error) {
        throw new Error(
          result.message || "Error al obtener los códigos QR pendientes."
        );
      }

      setPendingCodes(result.data || []);
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al obtener los códigos QR pendientes.";
      setError(errorMessage);
      message.error(errorMessage);
      setPendingCodes([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId, message]);

  useEffect(() => {
    fetchPendingCodes();
  }, [fetchPendingCodes]);

  useEffect(() => {
    if (onRefresh) {
      // Refresh when onRefresh changes (triggered from parent)
      fetchPendingCodes();
    }
  }, [onRefresh, fetchPendingCodes]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && pendingCodes.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spin size="large" />
      </div>
    );
  }

  if (error && pendingCodes.length === 0) {
    return (
      <Card>
        <Empty description={error} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  if (pendingCodes.length === 0) {
    return (
      <Card>
        <Empty
          description="No hay códigos QR pendientes de validación"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <div className="w-full">
      <Card>
        <Space orientation="vertical" size="middle" className="w-full">
          <div className="flex justify-between items-center">
            <Title level={5} className="mb-0">
              Códigos QR Pendientes
            </Title>
            <Text type="secondary">
              {pendingCodes.length}{" "}
              {pendingCodes.length === 1 ? "código" : "códigos"}
            </Text>
          </div>

          <div className="space-y-3">
            {pendingCodes.map((code) => (
              <Card key={code.id} className="w-full" size="small">
                <Space orientation="vertical" size="small" className="w-full">
                  <div className="flex items-center gap-2">
                    <RiQrCodeLine className="text-blue-500" />
                    <Text strong className="text-lg">
                      {code.identifier || "Sin identificador"}
                    </Text>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <RiUserLine className="text-gray-500" />
                      <Text type="secondary">
                        Creado por:{" "}
                        <Text strong>
                          {code.created_by_name || "Desconocido"}
                        </Text>
                      </Text>
                    </div>

                    <div className="flex items-center gap-1">
                      <RiTimeLine className="text-gray-500" />
                      <Text type="secondary">
                        Creado: {formatDate(code.created_at)}
                      </Text>
                    </div>

                    <div className="flex items-center gap-1">
                      <RiCalendarLine className="text-gray-500" />
                      <Text type="secondary">
                        Expira: {formatDate(code.expires_at)}
                      </Text>
                    </div>
                  </div>
                </Space>
              </Card>
            ))}
          </div>
        </Space>
      </Card>
    </div>
  );
}
