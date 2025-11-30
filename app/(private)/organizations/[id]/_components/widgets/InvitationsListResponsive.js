"use client";

import { useEffect, useState } from "react";
import {
  Table,
  Card,
  Space,
  Spin,
  Alert,
  Typography,
  Badge,
  Tag,
  Divider,
  Switch,
} from "antd";
import { RiMailLine, RiTimeLine } from "react-icons/ri";
import { useInvitations } from "@/hooks/useInvitations";
import { formatDateDDMMYYYY } from "@/utils/date";
import { useIsMobile } from "@/hooks/useMediaQuery";

const { Text, Paragraph } = Typography;

export default function InvitationsListResponsive({ organizationId }) {
  const { loading, error, getInvitations } = useInvitations();
  const [invitations, setInvitations] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const isMobile = useIsMobile();

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

  // Filter invitations: default show only pending, toggle shows all
  const filteredInvitations = showAll
    ? invitations
    : invitations.filter((inv) => inv.status === "pending");

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
      security: "Personal de Seguridad",
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
        <Tag
          color={
            roleName === "admin"
              ? "red"
              : roleName === "security"
              ? "orange"
              : "blue"
          }
        >
          {getRoleDisplayName(roleName)}
        </Tag>
      ),
    },
    {
      title: "Estado",
      key: "status",
      render: (_, record) =>
        getStatusBadge(record.status, record.is_expired),
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

  // Mobile: Card layout
  if (isMobile) {
    return (
      <Card
        title="Invitaciones"
        extra={
          <Space>
            <Text type="secondary" className="text-xs">
              {showAll ? "Mostrar todas" : "Solo pendientes"}
            </Text>
            <Switch
              checked={showAll}
              onChange={setShowAll}
              size="small"
            />
          </Space>
        }
      >
        {filteredInvitations.length === 0 ? (
          <Paragraph type="secondary">
            {showAll
              ? "No hay invitaciones para esta organización."
              : "No hay invitaciones pendientes."}
          </Paragraph>
        ) : (
          <Space direction="vertical" size="middle" className="w-full">
            {filteredInvitations.map((invitation) => (
              <Card
                key={invitation.id}
                size="small"
                className="shadow-sm"
                styles={{ body: { padding: "16px" } }}
              >
                <Space direction="vertical" size="small" className="w-full">
                  <div className="flex items-center justify-between">
                    <Space>
                      <RiMailLine className="text-gray-500 text-lg" />
                      <Text strong className="text-base">
                        {invitation.full_name}
                      </Text>
                    </Space>
                    {getStatusBadge(invitation.status, invitation.is_expired)}
                  </div>

                  <Text type="secondary" className="text-sm break-all">
                    {invitation.email}
                  </Text>

                  <Divider className="my-2" />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Text type="secondary" className="text-sm">
                        Rol:
                      </Text>
                      <Tag
                        color={
                          invitation.role?.name === "admin"
                            ? "red"
                            : invitation.role?.name === "security"
                            ? "orange"
                            : "blue"
                        }
                      >
                        {getRoleDisplayName(invitation.role?.name)}
                      </Tag>
                    </div>

                    <div className="flex items-center justify-between">
                      <Text type="secondary" className="text-sm">
                        Expira:
                      </Text>
                      <Space size="small">
                        <RiTimeLine className="text-gray-500" />
                        <Text
                          type={invitation.is_expired ? "danger" : "secondary"}
                          className="text-sm"
                        >
                          {invitation.expires_at
                            ? formatDateDDMMYYYY(invitation.expires_at)
                            : "N/A"}
                        </Text>
                      </Space>
                    </div>

                    {invitation.invited_by_name && (
                      <div className="flex items-center justify-between">
                        <Text type="secondary" className="text-sm">
                          Invitado por:
                        </Text>
                        <Text className="text-sm">
                          {invitation.invited_by_name}
                        </Text>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Text type="secondary" className="text-sm">
                        Fecha de Creación:
                      </Text>
                      <Text className="text-sm">
                        {invitation.created_at
                          ? formatDateDDMMYYYY(invitation.created_at)
                          : "N/A"}
                      </Text>
                    </div>
                  </div>
                </Space>
              </Card>
            ))}
          </Space>
        )}
      </Card>
    );
  }

  // Desktop: Table layout
  return (
    <Card
      title="Invitaciones"
      extra={
        <Space>
          <Text type="secondary">Solo pendientes</Text>
          <Switch checked={showAll} onChange={setShowAll} />
          <Text type="secondary">Mostrar todas</Text>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={filteredInvitations}
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

