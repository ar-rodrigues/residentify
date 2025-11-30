"use client";

import { useState, useEffect, useRef } from "react";
import { Form, Select, Switch, DatePicker, App } from "antd";
import { RiAddLine } from "react-icons/ri";
import { useGeneralInviteLinks } from "@/hooks/useGeneralInviteLinks";
import { useIsMobile } from "@/hooks/useMediaQuery";
import Button from "@/components/ui/Button";

export default function CreateGeneralInviteLinkForm({
  organizationId,
  onSuccess,
}) {
  const { message } = App.useApp();
  const { createGeneralInviteLink, loading } = useGeneralInviteLinks();
  const [form] = Form.useForm();
  const [organizationRoles, setOrganizationRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const formRef = useRef(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await fetch("/api/organization-roles");
      const result = await response.json();

      if (result.error) {
        message.error("Error al cargar los roles de organización.");
        return;
      }

      setOrganizationRoles(result.data || []);
    } catch (error) {
      console.error("Error fetching organization roles:", error);
      message.error("Error al cargar los roles de organización.");
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleCreate = async (values) => {
    // If a date is selected, set it to end of day (23:59:59) for expiration
    let expiresAt = null;
    if (values.expires_at) {
      const date = new Date(values.expires_at);
      date.setHours(23, 59, 59, 999);
      expiresAt = date.toISOString();
    }

    const result = await createGeneralInviteLink(organizationId, {
      organization_role_id: values.organization_role_id,
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
  };

  const getRoleDisplayName = (roleName) => {
    const roleMap = {
      admin: "Administrador",
      resident: "Residente",
      security: "Personal de Seguridad",
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
        name="organization_role_id"
        label="Rol"
        rules={[
          {
            required: true,
            message: "Por favor selecciona un rol",
          },
        ]}
      >
        <Select
          placeholder="Selecciona un rol"
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
        label="Requerir Aprobación"
        valuePropName="checked"
        initialValue={false}
      >
        <Switch checkedChildren="Sí" unCheckedChildren="No" />
      </Form.Item>

      <Form.Item name="expires_at" label="Fecha de Expiración (Opcional)">
        <DatePicker
          format="DD/MM/YYYY"
          className="w-full"
          size="large"
          placeholder="Selecciona una fecha (opcional)"
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
          Crear Enlace
        </Button>
      </Form.Item>
    </Form>
  );
}
