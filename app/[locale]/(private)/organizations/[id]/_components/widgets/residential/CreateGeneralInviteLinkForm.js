"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Form, Select, Switch, DatePicker, App } from "antd";
import { RiAddLine } from "react-icons/ri";
import { useGeneralInviteLinks } from "@/hooks/useGeneralInviteLinks";
import { useSeatTypes } from "@/hooks/useSeatTypes";
import { useIsMobile } from "@/hooks/useMediaQuery";
import Button from "@/components/ui/Button";

export default function CreateGeneralInviteLinkForm({
  organizationId,
  organizationTypeId,
  onSuccess,
}) {
  const t = useTranslations();
  const { message } = App.useApp();
  const { createGeneralInviteLink, loading } = useGeneralInviteLinks();
  const { data: seatTypes, loading: loadingSeatTypes } = useSeatTypes(organizationTypeId);
  const [form] = Form.useForm();
  const formRef = useRef(null);
  const isMobile = useIsMobile();

  const handleCreate = async (values) => {
    try {
      // Parse expiration date if provided
      let expiresAt = null;
      if (values.expires_at) {
        expiresAt = values.expires_at.toISOString();
      }

      const result = await createGeneralInviteLink(organizationId, {
        seat_type_id: values.seat_type_id,
        requires_approval: values.requires_approval || false,
        expires_at: expiresAt,
      });

      if (result.error) {
        message.error(result.message);
      } else {
        message.success(result.message);
        form.resetFields();
        if (onSuccess) {
          onSuccess(result.data);
        }
      }
    } catch (err) {
      message.error(err.message || "Error al crear el enlace de invitación.");
    }
  };

  const getRoleDisplayName = (roleName) => {
    const roleMap = {
      admin: t("organizations.members.roles.admin"),
      resident: t("organizations.members.roles.resident"),
      security: t("organizations.members.roles.security"),
    };
    return roleMap[roleName] || roleName;
  };

  return (
    <Form
      ref={formRef}
      form={form}
      onFinish={handleCreate}
      layout="vertical"
      requiredMark={false}
    >
      <Form.Item
        name="seat_type_id"
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
          loading={loadingSeatTypes}
          options={seatTypes.map((type) => ({
            value: type.id,
            label: getRoleDisplayName(type.name),
            description: type.description,
          }))}
        />
      </Form.Item>

      <Form.Item
        name="requires_approval"
        label={t("organizations.generalInviteLinks.form.requiresApproval")}
        valuePropName="checked"
        initialValue={false}
      >
        <Switch checkedChildren={t("organizations.generalInviteLinks.form.yes")} unCheckedChildren={t("organizations.generalInviteLinks.form.no")} />
      </Form.Item>

      <Form.Item name="expires_at" label={t("organizations.generalInviteLinks.form.expiresAt")}>
        <DatePicker
          format="DD/MM/YYYY"
          className="w-full"
          size="large"
          placeholder={t("organizations.generalInviteLinks.form.expiresAtPlaceholder")}
          getPopupContainer={(triggerNode) => {
            // Always render in body on mobile to prevent cutoff
            // On desktop, render relative to the trigger node
            if (isMobile) {
              return document.body;
            }
            // Find the modal content wrapper
            const modalContent = triggerNode.closest(".ant-modal-content");
            return modalContent || document.body;
          }}
          styles={{
            popup: {
              root: {
                ...(isMobile && {
                  position: "fixed",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 1050,
                  maxWidth: "90vw",
                  maxHeight: "80vh",
                  overflow: "auto",
                }),
              },
            },
          }}
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          icon={<RiAddLine />}
          size="large"
          className="w-full"
        >
          {t("organizations.generalInviteLinks.form.createButton")}
        </Button>
      </Form.Item>
    </Form>
  );
}
