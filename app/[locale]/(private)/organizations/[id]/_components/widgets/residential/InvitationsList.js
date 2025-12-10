"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Table, Card, Space, Spin, Alert, Typography, Badge, Tag } from "antd";
import { RiMailLine, RiTimeLine, RiCheckLine, RiCloseLine } from "react-icons/ri";
import { useInvitations } from "@/hooks/useInvitations";
import { formatDateDDMMYYYY } from "@/utils/date";

const { Text, Paragraph } = Typography;

export default function InvitationsList({ organizationId }) {
  const t = useTranslations();
  const { loading, error, getInvitations } = useInvitations();
  const [invitations, setInvitations] = useState([]);

  const loadInvitations = useCallback(async () => {
    const result = await getInvitations(organizationId);
    if (!result.error && result.data) {
      setInvitations(result.data);
    }
  }, [organizationId, getInvitations]);

  useEffect(() => {
    if (organizationId) {
      loadInvitations();
    }
  }, [organizationId, loadInvitations]);

  const getStatusBadge = (status, isExpired) => {
    if (isExpired) {
      return <Badge status="error" text={t("organizations.invitations.status.expired")} />;
    }
    switch (status) {
      case "pending":
        return <Badge status="processing" text={t("organizations.invitations.status.pending")} />;
      case "accepted":
        return <Badge status="success" text={t("organizations.invitations.status.accepted")} />;
      case "cancelled":
        return <Badge status="default" text={t("organizations.invitations.status.cancelled")} />;
      default:
        return <Badge status="default" text={status} />;
    }
  };

  const getRoleDisplayName = (roleName) => {
    return t(`organizations.members.roles.${roleName}`, { defaultValue: roleName });
  };

  const columns = [
    {
      title: t("organizations.invitations.columns.email"),
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
      title: t("organizations.invitations.columns.name"),
      dataIndex: "full_name",
      key: "full_name",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: t("organizations.invitations.columns.role"),
      dataIndex: ["role", "name"],
      key: "role",
      render: (roleName) => (
        <Tag color={
          roleName === "admin"
            ? "red"
            : roleName === "security"
            ? "orange"
            : "blue"
        }>
          {getRoleDisplayName(roleName)}
        </Tag>
      ),
    },
    {
      title: t("organizations.invitations.columns.status"),
      key: "status",
      render: (_, record) => getStatusBadge(record.status, record.is_expired),
    },
    {
      title: t("organizations.invitations.columns.expires"),
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
      title: t("organizations.invitations.columns.invitedBy"),
      dataIndex: "invited_by_name",
      key: "invited_by_name",
      render: (text) => text || "N/A",
    },
    {
      title: t("organizations.invitations.columns.createdAt"),
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => (date ? formatDateDDMMYYYY(date) : "N/A"),
    },
  ];

  if (loading && invitations.length === 0) {
    return (
      <Card>
        <div className="flex justify-center py-8">
          <Space orientation="vertical" align="center">
            <Spin size="large" />
            <Text type="secondary">{t("organizations.invitations.loading")}</Text>
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
          description={error.message || t("organizations.invitations.error")}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  if (!invitations || invitations.length === 0) {
    return (
      <Card title={t("organizations.invitations.title")}>
        <Paragraph type="secondary">
          {t("organizations.invitations.empty")}
        </Paragraph>
      </Card>
    );
  }

  return (
    <Card title={t("organizations.invitations.title")}>
      <Table
        columns={columns}
        dataSource={invitations}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => t("organizations.invitations.pagination.total", { total }),
        }}
      />
    </Card>
  );
}



