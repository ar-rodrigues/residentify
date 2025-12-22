"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, Table, Switch, Spin, Alert, App, Space, Divider } from "antd";
import { useChat } from "@/hooks/useChat";
import { useIsMobile } from "@/hooks/useMediaQuery";

export default function ChatPermissionsSettings({ organizationId }) {
  const t = useTranslations();
  const { message } = App.useApp();
  const isMobile = useIsMobile();
  const { permissions, roles, loading, loadingPermissions, updatePermission } =
    useChat(organizationId);
  const [updating, setUpdating] = useState({});

  const getRoleDisplayName = (roleName) => {
    return t(`organizations.members.roles.${roleName}`, {
      defaultValue: roleName,
    });
  };

  const handleToggle = async (
    senderRoleId,
    recipientRoleId,
    currentDisabled
  ) => {
    const key = `${senderRoleId}-${recipientRoleId}`;
    setUpdating((prev) => ({ ...prev, [key]: true }));

    try {
      await updatePermission(senderRoleId, recipientRoleId, !currentDisabled);
      message.success(
        currentDisabled
          ? t("chat.permissions.enabled")
          : t("chat.permissions.disabled")
      );
    } catch (err) {
      message.error(err.message || t("chat.permissions.updateError"));
    } finally {
      setUpdating((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Build table columns
  const columns = [
    {
      title: t("chat.permissions.senderRole"),
      dataIndex: "senderRoleName",
      key: "senderRoleName",
      fixed: "left",
      width: 150,
    },
    ...(roles || []).map((role) => ({
      title: getRoleDisplayName(role.name),
      dataIndex: `recipient_${role.id}`,
      key: `recipient_${role.id}`,
      align: "center",
      width: 120,
      render: (_, record) => {
        const permission = permissions.find(
          (p) =>
            p.senderRoleId === record.senderRoleId &&
            p.recipientRoleId === role.id
        );
        const key = `${record.senderRoleId}-${role.id}`;
        const isUpdating = updating[key];

        return (
          <Switch
            checked={!permission?.disabled}
            loading={isUpdating}
            onChange={() =>
              handleToggle(record.senderRoleId, role.id, permission?.disabled)
            }
            disabled={isUpdating}
          />
        );
      },
    })),
  ];

  // Build table data
  const dataSource = (roles || []).map((role) => {
    const row = {
      key: role.id,
      senderRoleId: role.id,
      senderRoleName: getRoleDisplayName(role.name),
    };
    return row;
  });

  // Show loading spinner while loading permissions and roles are empty
  if (loadingPermissions && roles.length === 0) {
    return (
      <Card title={t("chat.permissions.title")}>
        <div className="flex justify-center items-center py-8">
          <Space orientation="vertical" align="center">
            <Spin size="large" />
          </Space>
        </div>
      </Card>
    );
  }

  // Only show "no roles" message when not loading and roles are actually empty
  if (!loadingPermissions && roles.length === 0) {
    return (
      <Card title={t("chat.permissions.title")}>
        <Alert title={t("chat.permissions.noRoles")} type="info" showIcon />
      </Card>
    );
  }

  return (
    <Card title={t("chat.permissions.title")}>
      <Alert
        title={t("chat.permissions.description")}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      {isMobile ? (
        <div className="space-y-4">
          {dataSource.map((senderRole) => (
            <Card
              key={senderRole.key}
              size="small"
              title={
                <div
                  className="font-semibold text-base"
                  style={{
                    color: "var(--color-text-primary)",
                  }}
                >
                  {senderRole.senderRoleName}
                </div>
              }
              className="shadow-sm"
            >
              <div className="space-y-3">
                {roles.map((recipientRole) => {
                  const permission = permissions.find(
                    (p) =>
                      p.senderRoleId === senderRole.senderRoleId &&
                      p.recipientRoleId === recipientRole.id
                  );
                  const key = `${senderRole.senderRoleId}-${recipientRole.id}`;
                  const isUpdating = updating[key];

                  return (
                    <div
                      key={recipientRole.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                      style={{
                        borderColor: "var(--color-border)",
                      }}
                    >
                      <span
                        className="text-sm flex-1"
                        style={{
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {getRoleDisplayName(recipientRole.name)}
                      </span>
                      <Switch
                        checked={!permission?.disabled}
                        loading={isUpdating}
                        onChange={() =>
                          handleToggle(
                            senderRole.senderRoleId,
                            recipientRole.id,
                            permission?.disabled
                          )
                        }
                        disabled={isUpdating}
                        size="default"
                      />
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          scroll={{ x: "max-content" }}
          loading={loading || loadingPermissions}
        />
      )}
    </Card>
  );
}
