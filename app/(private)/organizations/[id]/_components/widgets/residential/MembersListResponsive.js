"use client";

import { useEffect, useState } from "react";
import {
  Table,
  Card,
  Space,
  Spin,
  Alert,
  Select,
  App,
  Typography,
  Badge,
  Tag,
  Divider,
  Dropdown,
  Button as AntButton,
} from "antd";
import {
  RiUserLine,
  RiDeleteBinLine,
  RiMoreLine,
  RiEditLine,
} from "react-icons/ri";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { formatDateDDMMYYYY } from "@/utils/date";
import Button from "@/components/ui/Button";
import { useIsMobile } from "@/hooks/useMediaQuery";

const { Text, Paragraph } = Typography;

export default function MembersListResponsive({ organizationId }) {
  const { modal, message } = App.useApp();
  const {
    data: members,
    loading,
    error,
    getMembers,
    updateMemberRole,
    removeMember,
  } = useOrganizationMembers();
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (organizationId) {
      getMembers(organizationId);
      fetchRoles();
    }
  }, [organizationId, getMembers]);

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await fetch("/api/organization-roles");
      const result = await response.json();
      if (!result.error && result.data) {
        setRoles(result.data);
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleRoleChange = async (memberId, newRoleId) => {
    try {
      setUpdatingMemberId(memberId);
      const result = await updateMemberRole(
        organizationId,
        memberId,
        newRoleId
      );
      if (result.error) {
        message.error(result.message);
      } else {
        message.success(result.message);
      }
    } catch (err) {
      message.error("Error inesperado al actualizar el rol.");
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = (member) => {
    modal.confirm({
      title: "¿Eliminar miembro?",
      content: `¿Estás seguro de que deseas eliminar a ${member.name} de la organización?`,
      okText: "Eliminar",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          const result = await removeMember(organizationId, member.id);
          if (result.error) {
            message.error(result.message);
          } else {
            message.success(result.message);
          }
        } catch (err) {
          message.error("Error inesperado al eliminar el miembro.");
        }
      },
    });
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
      title: "Nombre",
      dataIndex: "name",
      key: "name",
      width: 200,
      ellipsis: true,
      render: (text, record) => (
        <Space>
          <RiUserLine className="text-gray-500" />
          <Text 
            strong 
            style={{ 
              wordBreak: 'normal', 
              whiteSpace: 'normal',
              display: 'inline-block'
            }}
          >
            {text}
          </Text>
          {record.is_from_general_link && (
            <Tag color="purple">Invitado por enlace general</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Rol",
      dataIndex: ["role", "name"],
      key: "role",
      width: 150,
      render: (roleName) => (
        <Badge
          status={
            roleName === "admin"
              ? "error"
              : roleName === "security"
              ? "warning"
              : "default"
          }
          text={getRoleDisplayName(roleName)}
        />
      ),
    },
    {
      title: "Fecha de Ingreso",
      dataIndex: "joined_at",
      key: "joined_at",
      width: 140,
      render: (date) => (date ? formatDateDDMMYYYY(date) : "N/A"),
    },
    {
      title: "Invitado por",
      dataIndex: "invited_by_name",
      key: "invited_by_name",
      width: 180,
      ellipsis: true,
      render: (text) => text || "N/A",
    },
    {
      title: "Acciones",
      key: "actions",
      width: 280,
      render: (_, record) => (
        <Space size="small" wrap={false}>
          <Select
            value={record.role.id}
            onChange={(value) => handleRoleChange(record.id, value)}
            loading={updatingMemberId === record.id}
            disabled={updatingMemberId !== null}
            style={{ width: 160 }}
            size="small"
            options={roles.map((role) => ({
              value: role.id,
              label: getRoleDisplayName(role.name),
            }))}
          />
          <Button
            type="default"
            danger
            icon={<RiDeleteBinLine />}
            size="small"
            onClick={() => handleRemoveMember(record)}
            disabled={updatingMemberId !== null}
            style={{ whiteSpace: 'nowrap' }}
          >
            Eliminar
          </Button>
        </Space>
      ),
    },
  ];

  if (loading && !members) {
    return (
      <Card>
        <div className="flex justify-center py-8">
          <Space orientation="vertical" align="center">
            <Spin size="large" />
            <Text type="secondary">Cargando miembros...</Text>
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
          description={error.message || "Error al cargar los miembros."}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  if (!members || members.length === 0) {
    return (
      <Card title="Miembros">
        <Paragraph type="secondary">
          No hay miembros en esta organización.
        </Paragraph>
      </Card>
    );
  }

  // Mobile: Card layout
  if (isMobile) {
    const getRoleMenuItems = (member) => {
      return roles.map((role) => ({
        key: role.id,
        label: getRoleDisplayName(role.name),
        disabled:
          updatingMemberId !== null ||
          (updatingMemberId === member.id && loadingRoles),
        onClick: () => {
          if (role.id !== member.role.id) {
            handleRoleChange(member.id, role.id);
          }
        },
      }));
    };

    const getRoleBorderColor = (roleName) => {
      if (roleName === "admin") return "#dc2626"; // red-600
      if (roleName === "security") return "#ea580c"; // orange-600
      return "#2563eb"; // blue-600
    };

    return (
      <Card title="Miembros" styles={{ body: { padding: "12px" } }}>
        <Space orientation="vertical" size="small" className="w-full">
          {members.map((member) => (
            <Card
              key={member.id}
              size="small"
              className="shadow-sm"
              styles={{
                body: { padding: "12px" },
              }}
              style={{
                borderTop: `3px solid ${getRoleBorderColor(member.role.name)}`,
              }}
            >
              {/* Name - First row */}
              <div className="flex items-center mb-2">
                <RiUserLine className="text-gray-500 text-base mr-2 flex-shrink-0" />
                <div className="flex-1 break-words">
                  <Text strong className="text-base">
                    {member.name}
                  </Text>
                  {member.is_from_general_link && (
                    <Tag color="purple" className="ml-2">
                      Invitado por enlace general
                    </Tag>
                  )}
                </div>
              </div>

              {/* Role - Second row */}
              <div className="flex items-center justify-between mb-2">
                <Text className="text-sm">
                  {getRoleDisplayName(member.role.name)}
                </Text>
                <Space size="small">
                  <Dropdown
                    menu={{
                      items: getRoleMenuItems(member),
                    }}
                    trigger={["click"]}
                    disabled={updatingMemberId !== null}
                  >
                    <AntButton
                      type="text"
                      size="small"
                      icon={<RiEditLine className="text-sm" />}
                      loading={updatingMemberId === member.id}
                      disabled={updatingMemberId !== null}
                      style={{ padding: "0 4px", minWidth: "auto" }}
                      aria-label="Cambiar rol"
                    />
                  </Dropdown>
                  <AntButton
                    type="text"
                    danger
                    size="small"
                    icon={<RiDeleteBinLine className="text-sm" />}
                    onClick={() => handleRemoveMember(member)}
                    disabled={updatingMemberId !== null}
                    style={{ padding: "0 4px", minWidth: "auto" }}
                    aria-label="Eliminar miembro"
                  />
                </Space>
              </div>

              {/* Additional info */}
              <div className="space-y-1.5 mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <Text type="secondary" className="text-xs">
                    Ingreso:
                  </Text>
                  <Text className="text-xs text-right flex-1 ml-2">
                    {member.joined_at
                      ? formatDateDDMMYYYY(member.joined_at)
                      : "N/A"}
                  </Text>
                </div>

                {member.invited_by_name && (
                  <div className="flex items-center justify-between">
                    <Text type="secondary" className="text-xs">
                      Invitado por:
                    </Text>
                    <Text className="text-xs text-right flex-1 ml-2 break-words">
                      {member.invited_by_name}
                    </Text>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </Space>
      </Card>
    );
  }

  // Desktop: Table layout
  return (
    <Card title="Miembros" style={{ overflow: 'hidden' }}>
      <Table
        columns={columns}
        dataSource={members}
        rowKey="id"
        loading={loading}
        scroll={{ x: 'max-content' }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} miembros`,
        }}
      />
    </Card>
  );
}

