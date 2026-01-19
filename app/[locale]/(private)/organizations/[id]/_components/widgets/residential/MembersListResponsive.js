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
  App,
  Typography,
  Badge,
  Tag,
  Divider,
  Dropdown,
  Button as AntButton,
  Tooltip,
} from "antd";
import {
  RiUserLine,
  RiDeleteBinLine,
  RiMoreLine,
  RiEditLine,
  RiLinksLine,
  RiLayoutMasonryLine,
} from "react-icons/ri";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { useSeats } from "@/hooks/useSeats";
import { formatDateDDMMYYYY } from "@/utils/date";
import { normalizeName } from "@/utils/name";
import { getRoleIcon } from "@/config/roles";
import Button from "@/components/ui/Button";
import { useIsMobile } from "@/hooks/useMediaQuery";

const { Text, Paragraph } = Typography;

export default function MembersListResponsive({ organizationId }) {
  const t = useTranslations();
  const { modal, message } = App.useApp();
  const {
    data: members,
    loading,
    error,
    getMembers,
    updateMemberSeat,
    removeMember,
  } = useOrganizationMembers();
  
  const { data: seats, loading: loadingSeats } = useSeats(organizationId);
  const [updatingMemberId, setUpdatingMemberId] = useState(null);
  const [selectValues, setSelectValues] = useState({}); // Track select values by member ID
  const [openDropdowns, setOpenDropdowns] = useState({}); // Track open dropdowns by member ID
  const isMobile = useIsMobile();

  useEffect(() => {
    if (organizationId) {
      getMembers(organizationId);
    }
  }, [organizationId, getMembers]);

  // Initialize select values when members change
  useEffect(() => {
    if (members && members.length > 0) {
      const newSelectValues = {};
      members.forEach((member) => {
        newSelectValues[member.id] = member.seat?.id;
      });
      setSelectValues(newSelectValues);
    }
  }, [members]);

  const handleSeatChange = async (memberId, newSeatId, currentSeatId) => {
    try {
      setUpdatingMemberId(memberId);
      const result = await updateMemberSeat(
        organizationId,
        memberId,
        newSeatId
      );
      if (result.error) {
        // Show warning message without blocking the UI
        message.warning(result.message);
        // Reset the Select to the original seat value
        setSelectValues((prev) => ({ ...prev, [memberId]: currentSeatId }));
        return false; // Indicate failure
      } else {
        // Show success message briefly
        message.success(result.message);
        return true; // Indicate success
      }
    } catch (err) {
      message.warning("Error al actualizar el asiento");
      // Reset the Select to the original seat value
      setSelectValues((prev) => ({ ...prev, [memberId]: currentSeatId }));
      return false; // Indicate failure
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = (member) => {
    modal.confirm({
      title: t("organizations.members.modals.deleteTitle"),
      content: t("organizations.members.modals.deleteContent", {
        name: member.name,
      }),
      okText: t("organizations.members.modals.deleteOk"),
      okButtonProps: { danger: true },
      cancelText: t("organizations.members.modals.deleteCancel"),
      onOk: async () => {
        try {
          const result = await removeMember(organizationId, member.id);
          if (result.error) {
            message.error(result.message);
          } else {
            message.success(result.message);
          }
        } catch (err) {
          message.error(t("organizations.members.errors.deleteError"));
        }
      },
    });
  };

  const getRoleDisplayName = (roleName) => {
    return t(`organizations.members.roles.${roleName}`, {
      defaultValue: roleName,
    });
  };

  const getRoleIconComponent = (roleName) => {
    const IconComponent = getRoleIcon(roleName);
    return IconComponent || RiUserLine; // Fallback to RiUserLine if no icon found
  };

  const columns = [
    {
      title: t("organizations.members.columns.name"),
      dataIndex: "name",
      key: "name",
      width: 200,
      ellipsis: true,
      render: (text, record) => {
        const RoleIcon = getRoleIconComponent(record.seat?.type?.name);
        const normalizedName = normalizeName(text || "");
        return (
          <div
            style={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: "repeat(1, 1fr)",
              gridTemplateRows: "repeat(2, 1fr)",
            }}
          >
            {/* First row: Icon and Name */}
            <Space style={{ width: "100%" }}>
              <RoleIcon
                style={{
                  color: "var(--color-text-secondary)",
                  fontSize: "16px",
                }}
              />
              <Text
                strong
                style={{
                  wordBreak: "normal",
                  whiteSpace: "normal",
                  display: "inline-block",
                }}
              >
                {normalizedName}
              </Text>
              {record.is_from_general_link && (
                <Tooltip
                  title={t("organizations.members.labels.fromGeneralLink")}
                >
                  <RiLinksLine
                    className="text-purple-500 ml-1"
                    style={{ fontSize: "16px" }}
                  />
                </Tooltip>
              )}
            </Space>
            {/* Second row: Email */}
            {record.email && (
              <div style={{ marginTop: "4px" }}>
                <Text
                  type="secondary"
                  style={{
                    fontSize: "12px",
                    display: "block",
                    lineHeight: "1.5",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {record.email.toLowerCase()}
                </Text>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Asiento",
      dataIndex: ["seat", "name"],
      key: "seat",
      width: 150,
      render: (seatName, record) => (
        <Space orientation="vertical" size={0}>
          <Text strong>{seatName || "Sin asiento"}</Text>
          {record.seat?.type && (
            <Badge
              status={
                record.seat.type.name === "admin"
                  ? "error"
                  : record.seat.type.name === "security"
                  ? "warning"
                  : "default"
              }
              text={getRoleDisplayName(record.seat.type.name)}
              size="small"
            />
          )}
        </Space>
      ),
    },
    {
      title: t("organizations.members.columns.joinedAt"),
      dataIndex: "joined_at",
      key: "joined_at",
      width: 140,
      render: (date) => (date ? formatDateDDMMYYYY(date) : "N/A"),
    },
    {
      title: t("organizations.members.columns.invitedBy"),
      dataIndex: "invited_by_name",
      key: "invited_by_name",
      width: 180,
      ellipsis: true,
      render: (text) => text || "N/A",
    },
    {
      title: t("organizations.members.columns.actions"),
      key: "actions",
      width: 280,
      render: (_, record) => (
        <Space size="small" wrap={false}>
          <Select
            value={selectValues[record.id] ?? record.seat?.id}
            onChange={async (value) => {
              // Optimistically update the UI
              setSelectValues((prev) => ({ ...prev, [record.id]: value }));
              await handleSeatChange(record.id, value, record.seat?.id);
            }}
            loading={updatingMemberId === record.id}
            disabled={updatingMemberId !== null || loadingSeats}
            style={{ width: 160 }}
            size="small"
            options={seats?.map((seat) => ({
              value: seat.id,
              label: `${seat.name} (${getRoleDisplayName(seat.seat_types?.name || 'unknown')})`,
              disabled: seat.member_count >= seat.capacity && seat.id !== record.seat?.id,
            })) || []}
          />
          <Button
            danger
            icon={<RiDeleteBinLine />}
            size="small"
            onClick={() => handleRemoveMember(record)}
            disabled={updatingMemberId !== null}
            style={{ whiteSpace: "nowrap" }}
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

  // Mobile: Card layout
  if (isMobile) {
    const getSeatMenuItems = (member) => {
      return seats.map((seat) => ({
        key: seat.id,
        label: `${seat.name} (${getRoleDisplayName(seat.seat_types.name)})`,
        disabled:
          updatingMemberId !== null ||
          (updatingMemberId === member.id && loadingSeats) ||
          (seat.member_count >= seat.capacity && seat.id !== member.seat?.id),
        onClick: async () => {
          // Close the dropdown
          setOpenDropdowns((prev) => ({ ...prev, [member.id]: false }));
          if (seat.id !== member.seat?.id) {
            // Optimistically update the UI
            setSelectValues((prev) => ({ ...prev, [member.id]: seat.id }));
            await handleSeatChange(member.id, seat.id, member.seat?.id);
          }
        },
      }));
    };

    const getSeatBorderColor = (seatTypeName) => {
      if (seatTypeName === "admin") return "#dc2626"; // red-600
      if (seatTypeName === "security") return "#ea580c"; // orange-600
      return "#2563eb"; // blue-600
    };

    return (
      <Card
        title={t("organizations.members.title")}
        styles={{ body: { padding: "12px" } }}
      >
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
              <div className="mb-2">
                <div className="grid grid-cols-1 grid-rows-2 mb-0.5">
                  {/* First row: Icon and Name */}
                  <div className="flex items-center gap-2">
                    {(() => {
                      const RoleIcon = getRoleIconComponent(member.role?.name);
                      return (
                        <RoleIcon
                          className="flex-shrink-0"
                          style={{
                            color: "var(--color-text-secondary)",
                            fontSize: "16px",
                          }}
                        />
                      );
                    })()}
                    <div className="flex items-center gap-1 flex-wrap">
                      <Text strong className="text-base">
                        {normalizeName(member.name || "")}
                      </Text>
                      {member.is_from_general_link && (
                        <Tooltip
                          title={t(
                            "organizations.members.labels.fromGeneralLink"
                          )}
                        >
                          <RiLinksLine
                            className="text-purple-500 flex-shrink-0"
                            style={{ fontSize: "16px" }}
                          />
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  {/* Second row: Email */}
                  {member.email && (
                    <div
                      className="text-xs"
                      style={{
                        lineHeight: "1.5",
                        color: "var(--color-text-secondary)",
                        padding: 0,
                        margin: 0,
                        textIndent: 0,
                      }}
                    >
                      {member.email.toLowerCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Seat - Second row */}
              <div className="flex items-center justify-between mb-2">
                <Text className="text-sm">
                  {member.seat?.name || "Sin asiento"} ({getRoleDisplayName(member.seat?.type?.name)})
                </Text>
                <Space size="small">
                  <Dropdown
                    menu={{
                      items: getSeatMenuItems(member),
                    }}
                    trigger={["click"]}
                    disabled={updatingMemberId !== null}
                    open={openDropdowns[member.id] || false}
                    onOpenChange={(open) => {
                      setOpenDropdowns((prev) => ({
                        ...prev,
                        [member.id]: open,
                      }));
                    }}
                  >
                    <AntButton
                      type="text"
                      size="small"
                      icon={<RiEditLine className="text-sm" />}
                      loading={updatingMemberId === member.id}
                      disabled={updatingMemberId !== null}
                      style={{ padding: "0 4px", minWidth: "auto" }}
                      aria-label="Cambiar asiento"
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
                    aria-label={t("organizations.members.actions.deleteMember")}
                  />
                </Space>
              </div>

              {/* Additional info */}
              <div className="space-y-1.5 mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <Text type="secondary" className="text-xs">
                    {t("organizations.members.labels.joined")}
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
                      {t("organizations.members.labels.invitedBy")}
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
    <Card
      title={t("organizations.members.title")}
      style={{ overflow: "hidden" }}
    >
      <Table
        columns={columns}
        dataSource={members}
        rowKey="id"
        loading={loading}
        scroll={{ x: "max-content" }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) =>
            t("organizations.members.pagination.total", { total }),
        }}
      />
    </Card>
  );
}
