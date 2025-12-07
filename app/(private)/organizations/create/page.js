"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiBuildingLine } from "react-icons/ri";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useOrganizationTypes } from "@/hooks/useOrganizationTypes";
import { Form, Card, Typography, Space, Alert, Select, Spin } from "antd";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const { Title, Paragraph } = Typography;

export default function CreateOrganizationPage() {
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [createForm] = Form.useForm();
  const router = useRouter();
  const { createOrganization, loading } = useOrganizations();
  const { types, loading: typesLoading } = useOrganizationTypes();

  const handleCreate = async (values) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await createOrganization(
      values.name,
      values.organization_type_id
    );

    if (result.error) {
      setErrorMessage(result.message);
    } else {
      setSuccessMessage(result.message);
      // Redirect to organization detail page or dashboard after 2 seconds
      setTimeout(() => {
        router.push(`/organizations/${result.data.id}`);
      }, 2000);
    }
  };

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
                Crear Organización
              </Title>
              <Paragraph className="text-gray-600">
                Crea una nueva organización para gestionar accesos y miembros
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
              form={createForm}
              onFinish={handleCreate}
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

              <Form.Item
                name="organization_type_id"
                label="Tipo de Organización"
                rules={[
                  {
                    required: true,
                    message: "Por favor selecciona un tipo de organización",
                  },
                ]}
              >
                <Select
                  placeholder="Selecciona el tipo de organización"
                  size="large"
                  loading={typesLoading}
                  notFoundContent={
                    typesLoading ? (
                      <Spin size="small" />
                    ) : (
                      "No hay tipos disponibles"
                    )
                  }
                  options={types.map((type) => ({
                    value: type.id,
                    label: (
                      <div>
                        <div className="font-medium">{type.name}</div>
                        {type.description && (
                          <div className="text-xs text-gray-500">
                            {type.description}
                          </div>
                        )}
                      </div>
                    ),
                  }))}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="w-full"
                  size="large"
                >
                  Crear Organización
                </Button>
              </Form.Item>
            </Form>
          </Space>
        </Card>
      </div>
    </div>
  );
}
