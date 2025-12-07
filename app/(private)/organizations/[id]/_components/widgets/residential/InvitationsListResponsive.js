"use client";

import { useEffect, useState, useCallback } from "react";
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
  Modal,
} from "antd";
import {
  RiMailLine,
  RiTimeLine,
  RiCheckLine,
  RiCloseLine,
  RiLinksLine,
  RiFileCopyLine,
  RiDeleteBinLine,
  RiShieldCheckLine,
  RiUserLine,
} from "react-icons/ri";
import { useInvitations } from "@/hooks/useInvitations";
import { useGeneralInviteLinks } from "@/hooks/useGeneralInviteLinks";
import { formatDateDDMMYYYY } from "@/utils/date";
import { useIsMobile } from "@/hooks/useMediaQuery";
import Button from "@/components/ui/Button";
import { App } from "antd";

const { Text, Paragraph } = Typography;
const { confirm } = Modal;

export default function InvitationsListResponsive({ organizationId }) {
  const { message } = App.useApp();
  const {
    loading,
    error,
    getInvitations,
    approveInvitation,
    rejectInvitation,
  } = useInvitations();
  const {
    loading: linksLoading,
    getGeneralInviteLinks,
    deleteGeneralInviteLink,
  } = useGeneralInviteLinks();
  const [invitations, setInvitations] = useState([]);
  const [generalLinks, setGeneralLinks] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [copiedLinkId, setCopiedLinkId] = useState(null);
  const isMobile = useIsMobile();

  const loadInvitations = useCallback(async () => {
    const result = await getInvitations(organizationId);
    if (!result.error && result.data) {
      setInvitations(result.data);
    }
  }, [organizationId, getInvitations]);

  const loadGeneralLinks = useCallback(async () => {
    const result = await getGeneralInviteLinks(organizationId);
    if (!result.error && result.data) {
      setGeneralLinks(result.data);
    }
  }, [organizationId, getGeneralInviteLinks]);

  useEffect(() => {
    if (organizationId) {
      loadInvitations();
      loadGeneralLinks();
    }
  }, [organizationId, loadInvitations, loadGeneralLinks]);

  // Filter active (non-expired) general invite links
  const activeLinks = generalLinks.filter((link) => !link.is_expired);

  // Filter invitations: default show only pending and pending_approval, toggle shows all
  const filteredInvitations = showAll
    ? invitations
    : invitations.filter(
        (inv) => inv.status === "pending" || inv.status === "pending_approval"
      );

  const handleApprove = async (invitationId) => {
    setProcessingId(invitationId);
    const result = await approveInvitation(organizationId, invitationId);
    if (result.error) {
      message.error(result.message);
    } else {
      message.success(result.message);
      loadInvitations();
    }
    setProcessingId(null);
  };

  const handleReject = async (invitationId) => {
    setProcessingId(invitationId);
    const result = await rejectInvitation(organizationId, invitationId);
    if (result.error) {
      message.error(result.message);
    } else {
      message.success(result.message);
      loadInvitations();
    }
    setProcessingId(null);
  };

  const getStatusBadge = (status, isExpired) => {
    if (isExpired) {
      return <Badge status="error" text="Expirada" />;
    }
    switch (status) {
      case "pending":
        return <Badge status="processing" text="Pendiente" />;
      case "pending_approval":
        return <Badge status="warning" text="Pendiente de Aprobación" />;
      case "accepted":
        return <Badge status="success" text="Aceptada" />;
      case "cancelled":
        return <Badge status="default" text="Cancelada" />;
      case "rejected":
        return <Badge status="error" text="Rechazada" />;
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

  const getRoleColor = (roleName) => {
    if (roleName === "admin") return "red";
    if (roleName === "security") return "orange";
    return "blue";
  };

  const handleCopyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link.invite_url);
      setCopiedLinkId(link.id);
      message.success("Enlace copiado al portapapeles");
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (err) {
      console.error("Error copying link:", err);
      message.error("Error al copiar el enlace");
    }
  };

  const handleDeleteLink = (linkId) => {
    confirm({
      title: "¿Eliminar enlace de invitación?",
      content:
        "Esta acción no se puede deshacer. El enlace dejará de funcionar inmediatamente.",
      okText: "Eliminar",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: async () => {
        const result = await deleteGeneralInviteLink(organizationId, linkId);
        if (result.error) {
          message.error(result.message);
        } else {
          message.success(result.message);
          loadGeneralLinks();
        }
      },
    });
  };

  const getDaysLeft = (expiresAt) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  // Filter invitations that need approval (from general links with requires_approval)
  const pendingApprovalInvitations = invitations.filter(
    (inv) => inv.status === "pending_approval" && inv.is_from_general_link
  );

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
    {
      title: "Acciones",
      key: "actions",
      render: (_, record) => {
        if (record.status === "pending_approval") {
          return (
            <Space>
              <Button
                type="primary"
                size="small"
                icon={<RiCheckLine />}
                onClick={() => handleApprove(record.id)}
                loading={processingId === record.id}
              >
                Aprobar
              </Button>
              <Button
                danger
                size="small"
                icon={<RiCloseLine />}
                onClick={() => handleReject(record.id)}
                loading={processingId === record.id}
              >
                Rechazar
              </Button>
            </Space>
          );
        }
        return null;
      },
    },
  ];

  if (loading && invitations.length === 0) {
    return (
      <Card>
        <div className="flex justify-center py-8">
          <Space orientation="vertical" align="center">
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
          title="Error"
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
      <Space orientation="vertical" size="large" className="w-full">
        {/* Active General Invite Links Section */}
        {activeLinks.length > 0 && (
          <Card
            title="Enlaces de Invitación Activos"
            className="border-blue-200 bg-blue-50/50"
          >
            <Space orientation="vertical" size="small" className="w-full">
              {activeLinks.map((link) => (
                <Card
                  key={link.id}
                  size="small"
                  className="shadow-sm"
                  styles={{ body: { padding: "8px 12px" } }}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <RiLinksLine className="text-gray-500 text-base flex-shrink-0" />
                        <Tag color={getRoleColor(link.role_name)} className="flex-shrink-0">
                          {getRoleDisplayName(link.role_name)}
                        </Tag>
                        <Space size={4} className="text-xs text-gray-500 flex-shrink-0">
                          <RiUserLine className="text-xs" />
                          <Text type="secondary" className="text-xs whitespace-nowrap">
                            {link.usage_count || 0}x
                          </Text>
                        </Space>
                      </div>
                      <Space size="small" className="flex-shrink-0">
                        <Button
                          type="text"
                          icon={
                            copiedLinkId === link.id ? (
                              <RiCheckLine className="text-green-500" />
                            ) : (
                              <RiFileCopyLine />
                            )
                          }
                          onClick={() => handleCopyLink(link)}
                          size="small"
                          className="flex items-center justify-center"
                        />
                        <Button
                          type="text"
                          danger
                          icon={<RiDeleteBinLine />}
                          onClick={() => handleDeleteLink(link.id)}
                          size="small"
                          className="flex items-center justify-center"
                        />
                      </Space>
                    </div>
                    {link.expires_at && getDaysLeft(link.expires_at) !== null && (
                      <div className="flex items-center gap-1">
                        <RiTimeLine className="text-xs text-gray-500" />
                        <Text type="secondary" className="text-xs">
                          {getDaysLeft(link.expires_at)} {getDaysLeft(link.expires_at) === 1 ? 'día' : 'días'} restantes
                        </Text>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </Space>
          </Card>
        )}

        {/* Pending Approval Invitations Section */}
        {pendingApprovalInvitations.length > 0 && (
          <Card
            title="Pendientes de Aprobación"
            className="border-orange-200 bg-orange-50/50"
          >
            <Space orientation="vertical" size="middle" className="w-full">
              {pendingApprovalInvitations.map((invitation) => (
                <Card
                  key={invitation.id}
                  size="small"
                  className="shadow-sm"
                  styles={{ body: { padding: "16px" } }}
                >
                  <Space orientation="vertical" size="small" className="w-full">
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
                    </div>

                    <Divider className="my-2" />

                    <Space className="w-full" orientation="vertical" size="small">
                      <Button
                        type="primary"
                        icon={<RiCheckLine />}
                        onClick={() => handleApprove(invitation.id)}
                        loading={processingId === invitation.id}
                        className="w-full"
                        size="large"
                      >
                        Aprobar
                      </Button>
                      <Button
                        danger
                        icon={<RiCloseLine />}
                        onClick={() => handleReject(invitation.id)}
                        loading={processingId === invitation.id}
                        className="w-full"
                        size="large"
                      >
                        Rechazar
                      </Button>
                    </Space>
                  </Space>
                </Card>
              ))}
            </Space>
          </Card>
        )}

        {/* Regular Invitations Section */}
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
                : "No hay invitaciones pendientes o pendientes de aprobación."}
            </Paragraph>
          ) : (
            <Space orientation="vertical" size="middle" className="w-full">
              {filteredInvitations.map((invitation) => (
              <Card
                key={invitation.id}
                size="small"
                className="shadow-sm"
                styles={{ body: { padding: "16px" } }}
              >
                <Space orientation="vertical" size="small" className="w-full">
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

                  {invitation.status === "pending_approval" && (
                    <>
                      <Divider className="my-2" />
                      <Space className="w-full" orientation="vertical" size="small">
                        <Button
                          type="primary"
                          icon={<RiCheckLine />}
                          onClick={() => handleApprove(invitation.id)}
                          loading={processingId === invitation.id}
                          className="w-full"
                          size="large"
                        >
                          Aprobar
                        </Button>
                        <Button
                          danger
                          icon={<RiCloseLine />}
                          onClick={() => handleReject(invitation.id)}
                          loading={processingId === invitation.id}
                          className="w-full"
                          size="large"
                        >
                          Rechazar
                        </Button>
                      </Space>
                    </>
                  )}
                </Space>
              </Card>
            ))}
          </Space>
        )}
      </Card>
      </Space>
    );
  }

  // Desktop: Table layout
  return (
    <Space orientation="vertical" size="large" className="w-full">
      {/* Active General Invite Links Section */}
      {activeLinks.length > 0 && (
        <Card
          title="Enlaces de Invitación Activos"
          className="border-blue-200 bg-blue-50/50"
        >
          <div className="space-y-4">
            {activeLinks.map((link) => (
              <Card
                key={link.id}
                size="small"
                className="shadow-sm"
                styles={{ body: { padding: "16px" } }}
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <Space>
                    <RiLinksLine className="text-gray-500 text-xl" />
                    <Tag color={getRoleColor(link.role_name)}>
                      {getRoleDisplayName(link.role_name)}
                    </Tag>
                    {link.requires_approval && (
                      <Tag color="orange" icon={<RiShieldCheckLine />}>
                        Requiere Aprobación
                      </Tag>
                    )}
                  </Space>

                  <Space>
                    <Text type="secondary" className="text-sm">
                      Usos: {link.usage_count || 0}
                    </Text>
                    {link.expires_at && (
                      <Space size="small">
                        <RiTimeLine className="text-gray-500" />
                        <Text className="text-sm">
                          {formatDateDDMMYYYY(link.expires_at)}
                        </Text>
                      </Space>
                    )}
                    <Button
                      type="default"
                      icon={
                        copiedLinkId === link.id ? (
                          <RiCheckLine />
                        ) : (
                          <RiFileCopyLine />
                        )
                      }
                      onClick={() => handleCopyLink(link)}
                      size="large"
                    >
                      {copiedLinkId === link.id ? "Copiado" : "Copiar"}
                    </Button>
                    <Button
                      danger
                      icon={<RiDeleteBinLine />}
                      onClick={() => handleDeleteLink(link.id)}
                      size="large"
                    >
                      Eliminar
                    </Button>
                  </Space>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Pending Approval Invitations Section */}
      {pendingApprovalInvitations.length > 0 && (
        <Card
          title="Pendientes de Aprobación"
          className="border-orange-200 bg-orange-50/50"
        >
          <Table
            columns={columns}
            dataSource={pendingApprovalInvitations}
            rowKey="id"
            loading={loading}
            pagination={false}
          />
        </Card>
      )}

      {/* Regular Invitations Section */}
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
    </Space>
  );
}

