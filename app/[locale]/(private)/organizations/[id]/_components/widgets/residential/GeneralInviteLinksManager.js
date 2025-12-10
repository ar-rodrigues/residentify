"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  Space,
  Spin,
  Alert,
  Typography,
  Tag,
  Divider,
  Form,
  Select,
  Switch,
  DatePicker,
  Modal,
  App,
  Button as AntButton,
} from "antd";
import {
  RiLinksLine,
  RiFileCopyLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiTimeLine,
  RiShieldCheckLine,
  RiAddLine,
} from "react-icons/ri";
import { useGeneralInviteLinks } from "@/hooks/useGeneralInviteLinks";
import { formatDateDDMMYYYY } from "@/utils/date";
import { useIsMobile } from "@/hooks/useMediaQuery";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const { Text, Paragraph, Title } = Typography;
const { confirm } = Modal;

export default function GeneralInviteLinksManager({ organizationId }) {
  const t = useTranslations();
  const { modal, message } = App.useApp();
  const {
    loading,
    error,
    createGeneralInviteLink,
    getGeneralInviteLinks,
    deleteGeneralInviteLink,
  } = useGeneralInviteLinks();
  const [links, setLinks] = useState([]);
  const [organizationRoles, setOrganizationRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [form] = Form.useForm();
  const [isCreating, setIsCreating] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState(null);
  const isMobile = useIsMobile();

  const loadLinks = useCallback(async () => {
    const result = await getGeneralInviteLinks(organizationId);
    if (!result.error && result.data) {
      setLinks(result.data);
    }
  }, [organizationId, getGeneralInviteLinks]);

  const fetchRoles = useCallback(async () => {
    try {
      setLoadingRoles(true);
      const response = await fetch("/api/organization-roles");
      const result = await response.json();

      if (result.error) {
        message.error(t("organizations.generalInviteLinks.errors.loadRolesError"));
        return;
      }

      setOrganizationRoles(result.data || []);
    } catch (error) {
      console.error("Error fetching organization roles:", error);
      message.error(t("organizations.generalInviteLinks.errors.loadRolesError"));
    } finally {
      setLoadingRoles(false);
    }
  }, [message]);

  useEffect(() => {
    if (organizationId) {
      loadLinks();
      fetchRoles();
    }
  }, [organizationId, loadLinks, fetchRoles]);

  const handleCreate = async (values) => {
    setIsCreating(true);
    const result = await createGeneralInviteLink(organizationId, {
      organization_role_id: values.organization_role_id,
      requires_approval: values.requires_approval || false,
      expires_at: values.expires_at ? values.expires_at.toISOString() : null,
    });

    if (result.error) {
      message.error(result.message);
    } else {
      message.success(result.message);
      form.resetFields();
      setIsCreating(false);
      loadLinks();
    }
    setIsCreating(false);
  };

  const handleDelete = (linkId) => {
    confirm({
      title: t("organizations.invitations.generalLinks.deleteTitle"),
      content: t("organizations.invitations.generalLinks.deleteContent"),
      okText: t("organizations.invitations.generalLinks.deleteOk"),
      okButtonProps: { danger: true },
      cancelText: t("organizations.invitations.generalLinks.deleteCancel"),
      onOk: async () => {
        const result = await deleteGeneralInviteLink(organizationId, linkId);
        if (result.error) {
          message.error(result.message);
        } else {
          message.success(result.message);
          loadLinks();
        }
      },
    });
  };

  const handleCopyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link.invite_url);
      setCopiedLinkId(link.id);
      message.success(t("organizations.invitations.generalLinks.copySuccess"));
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (err) {
      console.error("Error copying link:", err);
      message.error(t("organizations.generalInviteLinks.errors.copyError"));
    }
  };

  const getRoleDisplayName = (roleName) => {
    return t(`organizations.members.roles.${roleName}`, { defaultValue: roleName });
  };

  const getRoleColor = (roleName) => {
    if (roleName === "admin") return "red";
    if (roleName === "security") return "orange";
    return "blue";
  };

  if (loading && links.length === 0) {
    return (
      <Card>
        <div className="flex justify-center py-8">
          <Space orientation="vertical" align="center">
            <Spin size="large" />
            <Text type="secondary">{t("organizations.generalInviteLinks.loading")}</Text>
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
          description={error.message || t("organizations.generalInviteLinks.error")}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Create Form */}
      <Card title={t("organizations.generalInviteLinks.createTitle")}>
        <Form
          form={form}
          onFinish={handleCreate}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="organization_role_id"
            label={t("organizations.generalInviteLinks.form.role")}
            rules={[
              {
                required: true,
                message: t("organizations.generalInviteLinks.form.roleRequired"),
              },
            ]}
          >
            <Select
              placeholder={t("organizations.generalInviteLinks.form.rolePlaceholder")}
              size="large"
              loading={loadingRoles}
              options={organizationRoles.map((role) => ({
                value: role.id,
                label: getRoleDisplayName(role.name),
                description: role.description,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="requires_approval"
            label={t("organizations.generalInviteLinks.form.requiresApproval")}
            valuePropName="checked"
            initialValue={false}
          >
            <Switch
              checkedChildren={t("organizations.generalInviteLinks.form.yes")}
              unCheckedChildren={t("organizations.generalInviteLinks.form.no")}
            />
          </Form.Item>

          <Form.Item
            name="expires_at"
            label={t("organizations.generalInviteLinks.form.expiresAt")}
          >
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              className="w-full"
              size="large"
              placeholder={t("organizations.generalInviteLinks.form.expiresAtPlaceholder")}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isCreating}
              icon={<RiAddLine />}
              size="large"
              className="w-full"
            >
              {t("organizations.generalInviteLinks.form.createButton")}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Links List */}
      <Card title={t("organizations.generalInviteLinks.title")}>
        {links.length === 0 ? (
          <Paragraph type="secondary">
            {t("organizations.generalInviteLinks.empty")}
          </Paragraph>
        ) : isMobile ? (
          <Space orientation="vertical" size="middle" className="w-full">
            {links.map((link) => (
              <Card
                key={link.id}
                size="small"
                className="shadow-sm"
                styles={{ body: { padding: "16px" } }}
              >
                <Space orientation="vertical" size="small" className="w-full">
                  <div className="flex items-center justify-between">
                    <Space>
                      <RiLinksLine className="text-gray-500 text-lg" />
                      <Text strong className="text-base">
                        {getRoleDisplayName(link.role_name)}
                      </Text>
                    </Space>
                    {link.is_expired && (
                      <Tag color="error">{t("organizations.generalInviteLinks.labels.expired")}</Tag>
                    )}
                  </div>

                  <Divider className="my-2" />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Text type="secondary" className="text-sm">
                        {t("organizations.generalInviteLinks.labels.requiresApproval")}
                      </Text>
                      {link.requires_approval ? (
                        <Tag color="orange" icon={<RiShieldCheckLine />}>
                          {t("organizations.generalInviteLinks.form.yes")}
                        </Tag>
                      ) : (
                        <Tag color="green">{t("organizations.generalInviteLinks.form.no")}</Tag>
                      )}
                    </div>

                    {link.expires_at && (
                      <div className="flex items-center justify-between">
                        <Text type="secondary" className="text-sm">
                          {t("organizations.generalInviteLinks.labels.expires")}
                        </Text>
                        <Space size="small">
                          <RiTimeLine className="text-gray-500" />
                          <Text
                            type={link.is_expired ? "danger" : "secondary"}
                            className="text-sm"
                          >
                            {formatDateDDMMYYYY(link.expires_at)}
                          </Text>
                        </Space>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Text type="secondary" className="text-sm">
                        {t("organizations.generalInviteLinks.labels.uses")}
                      </Text>
                      <Text className="text-sm">{link.usage_count || 0}</Text>
                    </div>

                    <div className="flex items-center justify-between">
                      <Text type="secondary" className="text-sm">
                        {t("organizations.generalInviteLinks.labels.created")}
                      </Text>
                      <Text className="text-sm">
                        {formatDateDDMMYYYY(link.created_at)}
                      </Text>
                    </div>
                  </div>

                  <Divider className="my-2" />

                  <Space className="w-full" orientation="vertical" size="small">
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
                      className="w-full"
                      size="large"
                    >
                      {copiedLinkId === link.id
                        ? t("organizations.generalInviteLinks.actions.copied")
                        : t("organizations.generalInviteLinks.actions.copyLink")}
                    </Button>
                    <Button
                      danger
                      icon={<RiDeleteBinLine />}
                      onClick={() => handleDelete(link.id)}
                      className="w-full"
                      size="large"
                    >
                      {t("organizations.generalInviteLinks.actions.delete")}
                    </Button>
                  </Space>
                </Space>
              </Card>
            ))}
          </Space>
        ) : (
          <div className="space-y-4">
            {links.map((link) => (
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
                        {t("organizations.invitations.generalLinks.requiresApproval")}
                      </Tag>
                    )}
                    {link.is_expired && (
                      <Tag color="error">{t("organizations.generalInviteLinks.labels.expired")}</Tag>
                    )}
                  </Space>

                  <Space>
                    <Text type="secondary" className="text-sm">
                      {t("organizations.generalInviteLinks.labels.uses")} {link.usage_count || 0}
                    </Text>
                    {link.expires_at && (
                      <Space size="small">
                        <RiTimeLine className="text-gray-500" />
                        <Text
                          type={link.is_expired ? "danger" : "secondary"}
                          className="text-sm"
                        >
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
                      {copiedLinkId === link.id ? t("organizations.generalInviteLinks.actions.copied") : t("organizations.generalInviteLinks.actions.copy")}
                    </Button>
                    <Button
                      danger
                      icon={<RiDeleteBinLine />}
                      onClick={() => handleDelete(link.id)}
                      size="large"
                    >
                      {t("organizations.generalInviteLinks.actions.delete")}
                    </Button>
                  </Space>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

