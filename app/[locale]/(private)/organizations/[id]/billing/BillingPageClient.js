"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { 
  Card, 
  Typography, 
  Space, 
  Statistic, 
  Progress, 
  Tag, 
  Spin, 
  Alert,
  Divider,
  Row,
  Col
} from "antd";
import { RiMoneyDollarBoxLine, RiVipCrownLine, RiCheckLine } from "react-icons/ri";
import { useSeatPackages } from "@/hooks/useSeatPackages";
import { formatDateDDMMYYYY } from "@/utils/date";

const { Title, Text, Paragraph } = Typography;

export default function BillingPageClient({ organizationId }) {
  const t = useTranslations();
  const { data, loading, error } = useSeatPackages(organizationId);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 px-4 max-w-4xl mx-auto">
        <Alert title="Error" description={error.message} type="error" showIcon />
      </div>
    );
  }

  const { packages, total_limit, current_usage } = data || { packages: [], total_limit: 0, current_usage: 0 };
  const usagePercent = total_limit > 0 ? Math.round((current_usage / total_limit) * 100) : 0;

  return (
    <div className="py-8 px-4 max-w-4xl mx-auto">
      <Space orientation="vertical" size="large" className="w-full">
        <div>
          <Title level={2}>
            <RiMoneyDollarBoxLine className="inline-block mr-2 mb-1" />
            Facturación y Planes
          </Title>
          <Paragraph type="secondary">
            Gestiona los paquetes de asientos de tu organización y monitorea el uso actual.
          </Paragraph>
        </div>

        <Row gutter={16}>
          <Col span={8}>
            <Card className="text-center">
              <Statistic title="Asientos Totales" value={total_limit} />
            </Card>
          </Col>
          <Col span={8}>
            <Card className="text-center">
              <Statistic title="En Uso" value={current_usage} />
            </Card>
          </Col>
          <Col span={8}>
            <Card className="text-center">
              <Statistic title="Disponibles" value={Math.max(0, total_limit - current_usage)} />
            </Card>
          </Col>
        </Row>

        <Card title="Uso de Asientos">
          <Progress 
            percent={usagePercent} 
            status={usagePercent > 100 ? "exception" : "active"} 
            strokeColor={usagePercent > 90 ? "#ff4d4f" : "#1890ff"}
          />
          <div className="mt-4">
            {usagePercent > 100 ? (
              <Alert 
                type="warning" 
                title="Límite excedido" 
                description={`Has excedido tu límite por ${current_usage - total_limit} asientos. Los asientos más recientes se marcarán como congelados.`}
                showIcon 
              />
            ) : (
              <Text type="secondary">
                Tu organización está utilizando el {usagePercent}% de los asientos contratados.
              </Text>
            )}
          </div>
        </Card>

        <Card title="Paquetes Activos">
          <div className="space-y-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    <RiVipCrownLine className="text-2xl text-yellow-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-base mb-1">{pkg.name}</div>
                    <Space orientation="vertical" size={0}>
                      <Text>{pkg.seat_count} asientos</Text>
                      {pkg.expires_at && (
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          Expira el {formatDateDDMMYYYY(pkg.expires_at)}
                        </Text>
                      )}
                    </Space>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <Tag color={pkg.status === "active" ? "green" : "default"}>
                    {pkg.status === "active" ? "ACTIVO" : pkg.status.toUpperCase()}
                  </Tag>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Divider />

        <div className="text-center">
          <Paragraph type="secondary">
            ¿Necesitas más asientos? Contacta a nuestro equipo de ventas para actualizar tu plan.
          </Paragraph>
        </div>
      </Space>
    </div>
  );
}
