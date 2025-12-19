"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
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

export default function InvitationsListResponsive({ organizationId }) {
  const t = useTranslations();
  const { message, modal } = App.useApp();
  const {
    loading,
    error,
    getInvitations,
    approveInvitation,
    rejectInvitation,
    deleteInvitation,
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

  const handleDelete = (invitationId) => {
    modal.confirm({
      title: t("organizations.invitations.deleteTitle"),
      content: t("organizations.invitations.deleteContent"),
      okText: t("organizations.invitations.deleteOk"),
      okButtonProps: { danger: true },
      cancelText: t("organizations.invitations.deleteCancel"),
      onOk: async () => {
        setProcessingId(invitationId);
        const result = await deleteInvitation(organizationId, invitationId);
        if (result.error) {
          message.error(result.message);
        } else {
          message.success(result.message);
          loadInvitations();
        }
        setProcessingId(null);
      },
    });
  };

  const getStatusBadge = (status, isExpired) => {
    if (isExpired) {
      return (
        <Badge
          status="error"
          text={t("organizations.invitations.status.expired")}
        />
      );
    }
    switch (status) {
      case "pending":
        return (
          <Badge
            status="processing"
            text={t("organizations.invitations.status.pending")}
          />
        );
      case "pending_approval":
        return (
          <Badge
            status="warning"
            text={t("organizations.invitations.status.pendingApproval")}
          />
        );
      case "accepted":
        return (
          <Badge
            status="success"
            text={t("organizations.invitations.status.accepted")}
          />
        );
      case "cancelled":
        return (
          <Badge
            status="default"
            text={t("organizations.invitations.status.cancelled")}
          />
        );
      case "rejected":
        return (
          <Badge
            status="error"
            text={t("organizations.invitations.status.rejected")}
          />
        );
      default:
        return <Badge status="default" text={status} />;
    }
  };

  const getRoleDisplayName = (roleName) => {
    return t(`organizations.members.roles.${roleName}`, {
      defaultValue: roleName,
    });
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
      message.success(t("organizations.invitations.generalLinks.copySuccess"));
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (err) {
      console.error("Error copying link:", err);
      message.error(t("organizations.invitations.generalLinks.copyError"));
    }
  };

  const handleDeleteLink = (linkId) => {
    modal.confirm({
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
    {
      title: t("organizations.invitations.columns.actions"),
      key: "actions",
      render: (_, record) => {
        const actions = [];

        if (record.status === "pending_approval") {
          actions.push(
            <Button
              key="approve"
              type="primary"
              size="small"
              icon={<RiCheckLine />}
              onClick={() => handleApprove(record.id)}
              loading={processingId === record.id}
            >
              {t("organizations.invitations.actions.approve")}
            </Button>,
            <Button
              key="reject"
              danger
              size="small"
              icon={<RiCloseLine />}
              onClick={() => handleReject(record.id)}
              loading={processingId === record.id}
            >
              {t("organizations.invitations.actions.reject")}
            </Button>
          );
        }

        // Show delete button for all statuses except accepted
        if (record.status !== "accepted") {
          actions.push(
            <Button
              key="delete"
              danger
              size="small"
              icon={<RiDeleteBinLine />}
              onClick={() => handleDelete(record.id)}
              loading={processingId === record.id}
            >
              {t("organizations.invitations.actions.delete")}
            </Button>
          );
        }

        return actions.length > 0 ? <Space>{actions}</Space> : null;
      },
    },
  ];

  if (loading && invitations.length === 0) {
    return (
      <Card>
        <div className="flex justify-center py-8">
          <Space orientation="vertical" align="center">
            <Spin size="large" />
            <Text type="secondary">
              {t("organizations.invitations.loading")}
            </Text>
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

  // Mobile: Card layout
  if (isMobile) {
    return (
      <Space orientation="vertical" size="large" className="w-full">
        {/* Active General Invite Links Section */}
        {activeLinks.length > 0 && (
          <Card
            title={t("organizations.invitations.generalLinks.title")}
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
                        <Tag
                          color={getRoleColor(link.role_name)}
                          className="flex-shrink-0"
                        >
                          {getRoleDisplayName(link.role_name)}
                        </Tag>
                        <Space
                          size={4}
                          className="text-xs text-gray-500 flex-shrink-0"
                        >
                          <RiUserLine className="text-xs" />
                          <Text
                            type="secondary"
                            className="text-xs whitespace-nowrap"
                          >
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
                    {link.expires_at &&
                      getDaysLeft(link.expires_at) !== null && (
                        <div className="flex items-center gap-1">
                          <RiTimeLine className="text-xs text-gray-500" />
                          <Text type="secondary" className="text-xs">
                            {t(
                              "organizations.invitations.generalLinks.daysLeft",
                              {
                                days: getDaysLeft(link.expires_at),
                              }
                            )}
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
            title={t("organizations.invitations.pendingApproval.title")}
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
                          {t("organizations.invitations.labels.role")}
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

                    {invitation.status === "pending_approval" ? (
                      <Space
                        className="w-full"
                        orientation="vertical"
                        size="small"
                      >
                        <Button
                          type="primary"
                          icon={<RiCheckLine />}
                          onClick={() => handleApprove(invitation.id)}
                          loading={processingId === invitation.id}
                          className="w-full"
                          size="large"
                        >
                          {t("organizations.invitations.actions.approve")}
                        </Button>
                        <Button
                          danger
                          icon={<RiCloseLine />}
                          onClick={() => handleReject(invitation.id)}
                          loading={processingId === invitation.id}
                          className="w-full"
                          size="large"
                        >
                          {t("organizations.invitations.actions.reject")}
                        </Button>
                      </Space>
                    ) : invitation.status !== "accepted" ? (
                      <Space
                        className="w-full"
                        orientation="vertical"
                        size="small"
                      >
                        <Button
                          danger
                          icon={<RiDeleteBinLine />}
                          onClick={() => handleDelete(invitation.id)}
                          loading={processingId === invitation.id}
                          className="w-full"
                          size="large"
                        >
                          {t("organizations.invitations.actions.delete")}
                        </Button>
                      </Space>
                    ) : null}
                  </Space>
                </Card>
              ))}
            </Space>
          </Card>
        )}

        {/* Regular Invitations Section */}
        <Card
          title={t("organizations.invitations.title")}
          extra={
            <Space>
              <Text type="secondary" className="text-xs">
                {showAll
                  ? t("organizations.invitations.filters.showAll")
                  : t("organizations.invitations.filters.onlyPending")}
              </Text>
              <Switch checked={showAll} onChange={setShowAll} size="small" />
            </Space>
          }
        >
          {filteredInvitations.length === 0 ? (
            <Paragraph type="secondary">
              {showAll
                ? t("organizations.invitations.empty")
                : t("organizations.invitations.emptyPending")}
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
                          {t("organizations.invitations.labels.role")}
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
                          {t("organizations.invitations.labels.expires")}
                        </Text>
                        <Space size="small">
                          <RiTimeLine className="text-gray-500" />
                          <Text
                            type={
                              invitation.is_expired ? "danger" : "secondary"
                            }
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
                            {t("organizations.invitations.labels.invitedBy")}
                          </Text>
                          <Text className="text-sm">
                            {invitation.invited_by_name}
                          </Text>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <Text type="secondary" className="text-sm">
                          {t("organizations.invitations.labels.createdAt")}
                        </Text>
                        <Text className="text-sm">
                          {invitation.created_at
                            ? formatDateDDMMYYYY(invitation.created_at)
                            : "N/A"}
                        </Text>
                      </div>
                    </div>

                    {invitation.status === "pending_approval" ? (
                      <>
                        <Divider className="my-2" />
                        <Space
                          className="w-full"
                          orientation="vertical"
                          size="small"
                        >
                          <Button
                            type="primary"
                            icon={<RiCheckLine />}
                            onClick={() => handleApprove(invitation.id)}
                            loading={processingId === invitation.id}
                            className="w-full"
                            size="large"
                          >
                            {t("organizations.invitations.actions.approve")}
                          </Button>
                          <Button
                            danger
                            icon={<RiCloseLine />}
                            onClick={() => handleReject(invitation.id)}
                            loading={processingId === invitation.id}
                            className="w-full"
                            size="large"
                          >
                            {t("organizations.invitations.actions.reject")}
                          </Button>
                        </Space>
                      </>
                    ) : invitation.status !== "accepted" ? (
                      <>
                        <Divider className="my-2" />
                        <Space
                          className="w-full"
                          orientation="vertical"
                          size="small"
                        >
                          <Button
                            danger
                            icon={<RiDeleteBinLine />}
                            onClick={() => handleDelete(invitation.id)}
                            loading={processingId === invitation.id}
                            className="w-full"
                            size="large"
                          >
                            {t("organizations.invitations.actions.delete")}
                          </Button>
                        </Space>
                      </>
                    ) : null}
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
    <Space orientation="vertical" size="large" className="w-full max-w-full overflow-x-hidden">
      {/* Active General Invite Links Section */}
      {activeLinks.length > 0 && (
        <Card
          title={t("organizations.invitations.generalLinks.title")}
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
                        {t(
                          "organizations.invitations.generalLinks.requiresApproval"
                        )}
                      </Tag>
                    )}
                  </Space>

                  <Space>
                    <Text type="secondary" className="text-sm">
                      {t("organizations.invitations.generalLinks.uses")}{" "}
                      {link.usage_count || 0}
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
                      {copiedLinkId === link.id
                        ? t("organizations.invitations.generalLinks.copied")
                        : t("organizations.invitations.generalLinks.copy")}
                    </Button>
                    <Button
                      danger
                      icon={<RiDeleteBinLine />}
                      onClick={() => handleDeleteLink(link.id)}
                      size="large"
                    >
                      {t("organizations.invitations.generalLinks.delete")}
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
          title={t("organizations.invitations.pendingApproval.title")}
          className="border-orange-200 bg-orange-50/50"
        >
          <div className="overflow-x-auto w-full">
            <Table
              columns={columns}
              dataSource={pendingApprovalInvitations}
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={{ x: "max-content" }}
            />
          </div>
        </Card>
      )}

      {/* Regular Invitations Section */}
      <Card
        title={t("organizations.invitations.title")}
        extra={
          <Space>
            <Text type="secondary">
              {t("organizations.invitations.filters.onlyPendingLabel")}
            </Text>
            <Switch checked={showAll} onChange={setShowAll} />
            <Text type="secondary">
              {t("organizations.invitations.filters.showAllLabel")}
            </Text>
          </Space>
        }
      >
        <div className="overflow-x-auto w-full">
          <Table
            columns={columns}
            dataSource={filteredInvitations}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) =>
                t("organizations.invitations.pagination.total", { total }),
            }}
            scroll={{ x: "max-content" }}
          />
        </div>
      </Card>
    </Space>
  );
}
