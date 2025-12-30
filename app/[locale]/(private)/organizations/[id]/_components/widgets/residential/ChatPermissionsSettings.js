"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, Table, Switch, Spin, Alert, App, Space, Divider, Tabs } from "antd";
import { useChat } from "@/hooks/useChat";
import { useIsMobile } from "@/hooks/useMediaQuery";

export default function ChatPermissionsSettings({
  organizationId,
  onPermissionChange,
}) {
  const t = useTranslations();
  const { message } = App.useApp();
  const isMobile = useIsMobile();
  const { permissions, roles, loading, loadingPermissions, updatePermission } =
    useChat(organizationId);
  const [updating, setUpdating] = useState({});
  const [rolePermissions, setRolePermissions] = useState([]);
  const [loadingRolePermissions, setLoadingRolePermissions] = useState(false);
  const [updatingRolePermissions, setUpdatingRolePermissions] = useState({});
  const [activeTab, setActiveTab] = useState("user-to-user");

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
      // Notify parent component that permissions have changed
      if (onPermissionChange) {
        onPermissionChange();
      }
    } catch (err) {
      message.error(err.message || t("chat.permissions.updateError"));
    } finally {
      setUpdating((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Fetch role-to-role permissions
  useEffect(() => {
    if (!organizationId || activeTab !== "role-conversations") return;

    const fetchRolePermissions = async () => {
      try {
        setLoadingRolePermissions(true);
        const response = await fetch(
          `/api/organizations/${organizationId}/chat/permissions`
        );
        const result = await response.json();

        if (!response.ok || result.error) {
          throw new Error(
            result.message || "Error al obtener los permisos de rol"
          );
        }

        setRolePermissions(result.data?.roleRolePermissions || []);
      } catch (err) {
        console.error("Error fetching role permissions:", err);
        message.error(err.message || "Error al obtener los permisos de rol");
      } finally {
        setLoadingRolePermissions(false);
      }
    };

    fetchRolePermissions();
  }, [organizationId, activeTab, message]);

  const handleToggleRolePermission = async (
    senderRoleId,
    recipientRoleId,
    currentEnabled
  ) => {
    const key = `${senderRoleId}-${recipientRoleId}`;
    setUpdatingRolePermissions((prev) => ({ ...prev, [key]: true }));

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/chat/permissions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            senderRoleId,
            recipientRoleId,
            disabled: !currentEnabled, // disabled = !enabled (default is allow, so disabled means add entry)
            isRoleToRole: true,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(
          result.message || "Error al actualizar el permiso de rol"
        );
      }

      message.success(
        !currentEnabled
          ? "Permiso de conversación de rol habilitado"
          : "Permiso de conversación de rol deshabilitado"
      );

      // Refresh role permissions
      const refreshResponse = await fetch(
        `/api/organizations/${organizationId}/chat/permissions`
      );
      const refreshResult = await refreshResponse.json();
      if (!refreshResponse.ok || refreshResult.error) {
        throw new Error("Error al actualizar la lista");
      }
      setRolePermissions(refreshResult.data?.roleRolePermissions || []);

      // Notify parent component that permissions have changed
      if (onPermissionChange) {
        onPermissionChange();
      }
    } catch (err) {
      message.error(err.message || "Error al actualizar el permiso");
    } finally {
      setUpdatingRolePermissions((prev) => ({ ...prev, [key]: false }));
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

  // Build role permissions table columns
  const roleColumns = [
    {
      title: "Rol que envía",
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
        const permission = rolePermissions.find(
          (p) =>
            p.senderRoleId === record.senderRoleId &&
            p.recipientRoleId === role.id
        );
        const key = `${record.senderRoleId}-${role.id}`;
        const isUpdating = updatingRolePermissions[key];
        const isEnabled = permission?.enabled || false;

        return (
          <Switch
            checked={isEnabled}
            loading={isUpdating}
            onChange={() =>
              handleToggleRolePermission(record.senderRoleId, role.id, isEnabled)
            }
            disabled={isUpdating}
          />
        );
      },
    })),
  ];

  // Build role permissions table data
  const roleDataSource = (roles || []).map((role) => {
    const row = {
      key: role.id,
      senderRoleId: role.id,
      senderRoleName: getRoleDisplayName(role.name),
    };
    return row;
  });

  const userToUserContent = (
    <>
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
    </>
  );

  const roleConversationsContent = (
    <>
      <Alert
        title="Permisos de Conversaciones de Rol"
        description="Controla qué roles pueden iniciar conversaciones con otros roles. Por defecto, ningún rol puede iniciar conversaciones con otros roles. Habilita los permisos según sea necesario."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      {loadingRolePermissions ? (
        <div className="flex justify-center items-center py-8">
          <Space orientation="vertical" align="center">
            <Spin size="large" />
          </Space>
        </div>
      ) : isMobile ? (
        <div className="space-y-4">
          {roleDataSource.map((senderRole) => (
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
                  const permission = rolePermissions.find(
                    (p) =>
                      p.senderRoleId === senderRole.senderRoleId &&
                      p.recipientRoleId === recipientRole.id
                  );
                  const key = `${senderRole.senderRoleId}-${recipientRole.id}`;
                  const isUpdating = updatingRolePermissions[key];
                  const isEnabled = permission?.enabled || false;

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
                        checked={isEnabled}
                        loading={isUpdating}
                        onChange={() =>
                          handleToggleRolePermission(
                            senderRole.senderRoleId,
                            recipientRole.id,
                            isEnabled
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
          columns={roleColumns}
          dataSource={roleDataSource}
          pagination={false}
          scroll={{ x: "max-content" }}
          loading={loadingRolePermissions}
        />
      )}
    </>
  );

  return (
    <Card title={t("chat.permissions.title")}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "user-to-user",
            label: "Usuario a Usuario",
            children: userToUserContent,
          },
          {
            key: "role-conversations",
            label: "Conversaciones de Rol",
            children: roleConversationsContent,
          },
        ]}
      />
    </Card>
  );
}
