"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, List, Typography, Space, Empty, Spin, Tag, App } from "antd";
import {
  RiHistoryLine,
  RiUserLine,
  RiTimeLine,
  RiLoginBoxLine,
  RiLogoutBoxLine,
  RiFileTextLine,
} from "react-icons/ri";
import { useAccessLogs } from "@/hooks/useAccessLogs";

const { Text, Title } = Typography;

export default function AccessHistoryList({ organizationId }) {
  const { message } = App.useApp();
  const { getAccessLogs, loading, data: accessLogs } = useAccessLogs();
  const [error, setError] = useState(null);

  const fetchAccessLogs = useCallback(async () => {
    if (!organizationId) return;

    try {
      setError(null);
      const result = await getAccessLogs({
        organization_id: organizationId,
        limit: 100,
        offset: 0,
      });

      if (result.error) {
        setError(result.message);
        message.error(result.message);
      }
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al obtener el historial de acceso.";
      setError(errorMessage);
      message.error(errorMessage);
    }
  }, [organizationId, getAccessLogs, message]);

  useEffect(() => {
    fetchAccessLogs();
  }, [fetchAccessLogs]);

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

  const getEntryTypeDisplay = (entryType) => {
    switch (entryType) {
      case "entry":
        return { text: "Entrada", color: "green", icon: <RiLoginBoxLine /> };
      case "exit":
        return { text: "Salida", color: "red", icon: <RiLogoutBoxLine /> };
      default:
        return { text: entryType || "N/A", color: "default", icon: null };
    }
  };

  if (loading && !accessLogs) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spin size="large" />
      </div>
    );
  }

  if (error && (!accessLogs || accessLogs.length === 0)) {
    return (
      <Card>
        <Empty
          description={error}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  if (!accessLogs || accessLogs.length === 0) {
    return (
      <Card>
        <Empty
          description="No hay registros de acceso aún"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <div className="w-full">
      <Card>
        <Space direction="vertical" size="middle" className="w-full">
          <div className="flex justify-between items-center">
            <Title level={5} className="mb-0">
              Historial de Acceso
            </Title>
            <Text type="secondary">
              {accessLogs.length} {accessLogs.length === 1 ? "registro" : "registros"}
            </Text>
          </div>

          <List
            dataSource={accessLogs}
            loading={loading}
            renderItem={(log) => {
              const entryTypeInfo = getEntryTypeDisplay(log.entry_type);
              return (
                <List.Item>
                  <Card className="w-full" size="small">
                    <Space direction="vertical" size="small" className="w-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {entryTypeInfo.icon}
                          <Tag color={entryTypeInfo.color}>
                            {entryTypeInfo.text}
                          </Tag>
                        </div>
                        <Text type="secondary" className="text-xs">
                          {formatDate(log.timestamp)}
                        </Text>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        {log.visitor_name && (
                          <div className="flex items-center gap-1">
                            <RiUserLine className="text-gray-500" />
                            <Text type="secondary">
                              Visitante: <Text strong>{log.visitor_name}</Text>
                            </Text>
                          </div>
                        )}

                        {log.scanned_by_name && (
                          <div className="flex items-center gap-1">
                            <RiHistoryLine className="text-gray-500" />
                            <Text type="secondary">
                              Escaneado por: <Text strong>{log.scanned_by_name}</Text>
                            </Text>
                          </div>
                        )}

                        {log.qr_code?.identifier && (
                          <div className="flex items-center gap-1">
                            <RiFileTextLine className="text-gray-500" />
                            <Text type="secondary">
                              Identificador: <Text code>{log.qr_code.identifier}</Text>
                            </Text>
                          </div>
                        )}
                      </div>

                      {log.notes && (
                        <div className="mt-2">
                          <Text type="secondary" className="text-xs italic">
                            Notas: {log.notes}
                          </Text>
                        </div>
                      )}
                    </Space>
                  </Card>
                </List.Item>
              );
            }}
          />
        </Space>
      </Card>
    </div>
  );
}




