"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RiBuildingLine, RiArrowLeftLine } from "react-icons/ri";
import { useOrganizations } from "@/hooks/useOrganizations";
import { Form, Card, Typography, Space, Alert, Spin } from "antd";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const { Title, Paragraph } = Typography;

export default function EditOrganizationPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { getOrganization, updateOrganization, data: organization, loading } = useOrganizations();
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [editForm] = Form.useForm();
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (id) {
      setFetching(true);
      getOrganization(id).then((result) => {
        setFetching(false);
        if (result.error) {
          setErrorMessage(result.message);
        } else if (result.data) {
          // Set form initial values
          editForm.setFieldsValue({
            name: result.data.name,
          });
        }
      });
    }
  }, [id, getOrganization, editForm]);

  const handleUpdate = async (values) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await updateOrganization(id, values.name);

    if (result.error) {
      setErrorMessage(result.message);
    } else {
      setSuccessMessage(result.message);
      // Redirect to organization detail page after 2 seconds
      setTimeout(() => {
        router.push(`/organizations/${id}`);
      }, 2000);
    }
  };

  const handleCancel = () => {
    router.push(`/organizations/${id}`);
  };

  if (fetching || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Space orientation="vertical" align="center" size="large">
          <Spin size="large" />
          <Paragraph>Cargando organización...</Paragraph>
        </Space>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <Card>
            <Space orientation="vertical" size="large" className="w-full">
              <Alert
                title="Error"
                description={
                  errorMessage || "No se pudo cargar la organización."
                }
                type="error"
                showIcon
              />
              <Button
                type="primary"
                onClick={() => router.push("/organizations")}
                className="w-full"
              >
                Volver a Organizaciones
              </Button>
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  if (!organization.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <Card>
            <Space orientation="vertical" size="large" className="w-full">
              <Alert
                title="Acceso Denegado"
                description="Solo los administradores pueden editar organizaciones."
                type="error"
                showIcon
              />
              <Button
                type="primary"
                onClick={() => router.push(`/organizations/${id}`)}
                className="w-full"
              >
                Volver a la Organización
              </Button>
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="shadow-lg">
          <Space orientation="vertical" size="large" className="w-full">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <RiBuildingLine className="text-4xl text-blue-600" />
              </div>
              <Title level={2} className="mb-2">
                Editar Organización
              </Title>
              <Paragraph className="text-gray-600">
                Actualiza la información de tu organización
              </Paragraph>
            </div>

            {errorMessage && (
              <Alert
                title="Error"
                description={errorMessage}
                type="error"
                showIcon
                closable
                onClose={() => setErrorMessage(null)}
              />
            )}

            {successMessage && (
              <Alert
                title="Éxito"
                description={successMessage}
                type="success"
                showIcon
              />
            )}

            <Form
              form={editForm}
              onFinish={handleUpdate}
              layout="vertical"
              requiredMark={false}
            >
              <Form.Item
                name="name"
                rules={[
                  {
                    required: true,
                    message: "Por favor ingresa el nombre de la organización",
                  },
                  {
                    min: 2,
                    message: "El nombre debe tener al menos 2 caracteres",
                  },
                  {
                    max: 100,
                    message: "El nombre no puede tener más de 100 caracteres",
                  },
                  {
                    whitespace: true,
                    message: "El nombre no puede estar vacío",
                  },
                ]}
              >
                <Input
                  prefixIcon={<RiBuildingLine />}
                  placeholder="Nombre de la organización"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Space className="w-full" orientation="vertical" size="middle">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="w-full"
                    size="large"
                  >
                    Guardar Cambios
                  </Button>
                  <Button
                    htmlType="button"
                    onClick={handleCancel}
                    className="w-full"
                    size="large"
                    icon={<RiArrowLeftLine />}
                  >
                    Cancelar
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Space>
        </Card>
      </div>
    </div>
  );
}








