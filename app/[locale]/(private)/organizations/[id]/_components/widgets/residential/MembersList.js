"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
  message,
} from "antd";
import { RiUserLine, RiDeleteBinLine, RiEditLine } from "react-icons/ri";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { formatDateDDMMYYYY } from "@/utils/date";
import Button from "@/components/ui/Button";

const { Text, Paragraph } = Typography;
const { confirm } = Modal;

export default function MembersList({ organizationId }) {
  const t = useTranslations();
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
  const [selectValues, setSelectValues] = useState({}); // Track select values by member ID

  useEffect(() => {
    if (organizationId) {
      getMembers(organizationId);
      fetchRoles();
    }
  }, [organizationId, getMembers]);

  // Initialize select values when members change
  useEffect(() => {
    if (members && members.length > 0) {
      const newSelectValues = {};
      members.forEach((member) => {
        newSelectValues[member.id] = member.role.id;
      });
      setSelectValues(newSelectValues);
    }
  }, [members]);

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

  const handleRoleChange = async (memberId, newRoleId, currentRoleId) => {
    try {
      setUpdatingMemberId(memberId);
      const result = await updateMemberRole(
        organizationId,
        memberId,
        newRoleId
      );
      if (result.error) {
        // Show warning message without blocking the UI
        message.warning(result.message);
        return false; // Indicate failure to reset Select
      } else {
        // Show success message briefly
        message.success(result.message);
      }
    } catch (err) {
      message.warning(t("organizations.members.errors.updateRoleError"));
      return false; // Indicate failure to reset Select
    } finally {
      setUpdatingMemberId(null);
    }
    return true; // Indicate success
  };

  const handleRemoveMember = (member) => {
    confirm({
      title: t("organizations.members.modals.deleteTitle"),
      content: t("organizations.members.modals.deleteContent", { name: member.name }),
      okText: t("organizations.members.modals.deleteOk"),
      okButtonProps: { danger: true },
      cancelText: t("organizations.members.modals.deleteCancel"),
      onOk: async () => {
        try {
          const result = await removeMember(organizationId, member.id);
          if (result.error) {
            Modal.error({
              title: t("common.errorTitle"),
              content: result.message,
            });
          } else {
            Modal.success({
              title: t("common.success"),
              content: result.message,
            });
          }
        } catch (err) {
          Modal.error({
            title: t("common.error"),
            content: t("organizations.members.errors.deleteError"),
          });
        }
      },
    });
  };

  const getRoleDisplayName = (roleName) => {
    return t(`organizations.members.roles.${roleName}`, { defaultValue: roleName });
  };

  const columns = [
    {
      title: t("organizations.members.columns.name"),
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
      title: t("organizations.members.columns.role"),
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
      title: t("organizations.members.columns.joinedAt"),
      dataIndex: "joined_at",
      key: "joined_at",
      render: (date) => (date ? formatDateDDMMYYYY(date) : "N/A"),
    },
    {
      title: t("organizations.members.columns.invitedBy"),
      dataIndex: "invited_by_name",
      key: "invited_by_name",
      render: (text) => text || "N/A",
    },
    {
      title: t("organizations.members.columns.actions"),
      key: "actions",
      render: (_, record) => (
        <Space>
          <Select
            value={selectValues[record.id] ?? record.role.id}
            onChange={async (value) => {
              // Optimistically update the UI
              setSelectValues((prev) => ({ ...prev, [record.id]: value }));
              const success = await handleRoleChange(record.id, value, record.role.id);
              // If failed, reset to original value
              if (!success) {
                setSelectValues((prev) => ({ ...prev, [record.id]: record.role.id }));
              }
            }}
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
            {t("organizations.members.actions.delete")}
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
            <Text type="secondary">{t("organizations.members.loading")}</Text>
          </Space>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert
          title={t("common.error")}
          description={error.message || t("organizations.members.error")}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  if (!members || members.length === 0) {
    return (
      <Card title={t("organizations.members.title")}>
        <Paragraph type="secondary">
          {t("organizations.members.empty")}
        </Paragraph>
      </Card>
    );
  }

  return (
    <Card title={t("organizations.members.title")}>
      <Table
        columns={columns}
        dataSource={members}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => t("organizations.members.pagination.total", { total }),
        }}
      />
    </Card>
  );
}



