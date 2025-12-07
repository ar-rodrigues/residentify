"use client";

import { useEffect, useState } from "react";
import {
  Table,
  Card,
  Space,
  Spin,
  Alert,
  Select,
  Modal,
  Typography,
  Badge,
} from "antd";
import { RiUserLine, RiDeleteBinLine, RiEditLine } from "react-icons/ri";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { formatDateDDMMYYYY } from "@/utils/date";
import Button from "@/components/ui/Button";

const { Text, Paragraph } = Typography;
const { confirm } = Modal;

export default function MembersList({ organizationId }) {
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
        Modal.error({
          title: "Error",
          content: result.message,
        });
      } else {
        Modal.success({
          title: "Éxito",
          content: result.message,
        });
      }
    } catch (err) {
      Modal.error({
        title: "Error",
        content: "Error inesperado al actualizar el rol.",
      });
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = (member) => {
    confirm({
      title: "¿Eliminar miembro?",
      content: `¿Estás seguro de que deseas eliminar a ${member.name} de la organización?`,
      okText: "Eliminar",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          const result = await removeMember(organizationId, member.id);
          if (result.error) {
            Modal.error({
              title: "Error",
              content: result.message,
            });
          } else {
            Modal.success({
              title: "Éxito",
              content: result.message,
            });
          }
        } catch (err) {
          Modal.error({
            title: "Error",
            content: "Error inesperado al eliminar el miembro.",
          });
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
      render: (text) => (
        <Space>
          <RiUserLine className="text-gray-500" />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Rol",
      dataIndex: ["role", "name"],
      key: "role",
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
      render: (date) => (date ? formatDateDDMMYYYY(date) : "N/A"),
    },
    {
      title: "Invitado por",
      dataIndex: "invited_by_name",
      key: "invited_by_name",
      render: (text) => text || "N/A",
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Select
            value={record.role.id}
            onChange={(value) => handleRoleChange(record.id, value)}
            loading={updatingMemberId === record.id}
            disabled={updatingMemberId !== null}
            style={{ width: 180 }}
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

  return (
    <Card title="Miembros">
      <Table
        columns={columns}
        dataSource={members}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} miembros`,
        }}
      />
    </Card>
  );
}



