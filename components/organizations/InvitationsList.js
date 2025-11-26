"use client";

import { useEffect, useState } from "react";
import { Table, Card, Space, Spin, Alert, Typography, Badge, Tag } from "antd";
import { RiMailLine, RiTimeLine, RiCheckLine, RiCloseLine } from "react-icons/ri";
import { useInvitations } from "@/hooks/useInvitations";
import { formatDateDDMMYYYY } from "@/utils/date";

const { Text, Paragraph } = Typography;

export default function InvitationsList({ organizationId }) {
  const { loading, error, getInvitations } = useInvitations();
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    if (organizationId) {
      loadInvitations();
    }
  }, [organizationId]);

  const loadInvitations = async () => {
    const result = await getInvitations(organizationId);
    if (!result.error && result.data) {
      setInvitations(result.data);
    }
  };

  const getStatusBadge = (status, isExpired) => {
    if (isExpired) {
      return <Badge status="error" text="Expirada" />;
    }
    switch (status) {
      case "pending":
        return <Badge status="processing" text="Pendiente" />;
      case "accepted":
        return <Badge status="success" text="Aceptada" />;
      case "cancelled":
        return <Badge status="default" text="Cancelada" />;
      default:
        return <Badge status="default" text={status} />;
    }
  };

  const getRoleDisplayName = (roleName) => {
    const roleMap = {
      admin: "Administrador",
      resident: "Residente",
      security_personnel: "Personal de Seguridad",
    };
    return roleMap[roleName] || roleName;
  };

  const columns = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text) => (
        <Space>
          <RiMailLine className="text-gray-500" />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Nombre",
      dataIndex: "full_name",
      key: "full_name",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Rol",
      dataIndex: ["role", "name"],
      key: "role",
      render: (roleName) => (
        <Tag color={
          roleName === "admin"
            ? "red"
            : roleName === "security_personnel"
            ? "orange"
            : "blue"
        }>
          {getRoleDisplayName(roleName)}
        </Tag>
      ),
    },
    {
      title: "Estado",
      key: "status",
      render: (_, record) => getStatusBadge(record.status, record.is_expired),
    },
    {
      title: "Expira",
      dataIndex: "expires_at",
      key: "expires_at",
      render: (date, record) => (
        <Space>
          <RiTimeLine className="text-gray-500" />
          <Text type={record.is_expired ? "danger" : "secondary"}>
            {date ? formatDateDDMMYYYY(date) : "N/A"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Invitado por",
      dataIndex: "invited_by_name",
      key: "invited_by_name",
      render: (text) => text || "N/A",
    },
    {
      title: "Fecha de Creación",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => (date ? formatDateDDMMYYYY(date) : "N/A"),
    },
  ];

  if (loading && invitations.length === 0) {
    return (
      <Card>
        <div className="flex justify-center py-8">
          <Space direction="vertical" align="center">
            <Spin size="large" />
            <Text type="secondary">Cargando invitaciones...</Text>
          </Space>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert
          message="Error"
          description={error.message || "Error al cargar las invitaciones."}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  if (!invitations || invitations.length === 0) {
    return (
      <Card title="Invitaciones">
        <Paragraph type="secondary">
          No hay invitaciones para esta organización.
        </Paragraph>
      </Card>
    );
  }

  return (
    <Card title="Invitaciones">
      <Table
        columns={columns}
        dataSource={invitations}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} invitaciones`,
        }}
      />
    </Card>
  );
}


