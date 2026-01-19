"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { 
  Card, 
  Table, 
  Tag, 
  Space, 
  Typography, 
  Badge, 
  Button as AntButton, 
  Modal, 
  Form, 
  Input as AntInput, 
  Select, 
  Spin, 
  Alert 
} from "antd";
import { RiLayoutMasonryLine, RiAddLine, RiInformationLine, RiSnowflakeLine } from "react-icons/ri";
import { useSeats } from "@/hooks/useSeats";
import { useSeatTypes } from "@/hooks/useSeatTypes";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import Button from "@/components/ui/Button";

const { Title, Text, Paragraph } = Typography;

export default function SeatsPageClient({ organizationId }) {
  const t = useTranslations();
  const { organization } = useCurrentOrganization();
  const { data: seats, loading, error, refetch, createSeat } = useSeats(organizationId);
  const { data: seatTypes, loading: loadingTypes } = useSeatTypes(organization?.organization_type_id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleCreateSeat = async (values) => {
    const result = await createSeat(values);
    if (!result.error) {
      setIsModalOpen(false);
      form.resetFields();
    } else {
      Modal.error({ title: "Error", content: result.message });
    }
  };

  const columns = [
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <Text strong>{text}</Text>
          {record.is_frozen && (
            <Tag icon={<RiSnowflakeLine />} color="blue">
              Congelado
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Tipo",
      dataIndex: ["seat_types", "name"],
      key: "type",
      render: (name) => <Tag color="geekblue">{name.toUpperCase()}</Tag>,
    },
    {
      title: "Capacidad",
      dataIndex: "capacity",
      key: "capacity",
      render: (capacity, record) => (
        <Text>
          {record.member_count} / {capacity}
        </Text>
      ),
    },
    {
      title: "Estado",
      dataIndex: "is_active",
      key: "status",
      render: (isActive, record) => (
        <Badge 
          status={record.is_frozen ? "warning" : isActive ? "success" : "default"} 
          text={record.is_frozen ? "Congelado" : isActive ? "Activo" : "Inactivo"} 
        />
      ),
    },
  ];

  if (loading && seats.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      <Space orientation="vertical" size="large" className="w-full">
        <div className="flex justify-between items-center">
          <div>
            <Title level={2}>
              <RiLayoutMasonryLine className="inline-block mr-2 mb-1" />
              Gestión de Asientos
            </Title>
            <Paragraph type="secondary">
              Los asientos representan las unidades de cobro (apartamentos, oficinas, etc.) y definen los permisos de los usuarios.
            </Paragraph>
          </div>
          <Button 
            type="primary" 
            icon={<RiAddLine />} 
            onClick={() => setIsModalOpen(true)}
          >
            Nuevo Asiento
          </Button>
        </div>

        {error && (
          <Alert
            title="Error"
            description={error.message}
            type="error"
            showIcon
          />
        )}

        <Card>
          <Table 
            dataSource={seats} 
            columns={columns} 
            rowKey="id" 
            pagination={false}
          />
        </Card>

        <Alert
          title="Información sobre Asientos"
          description="Cada organización tiene un límite de asientos activos según su plan actual. Los asientos que exceden este límite son marcados automáticamente como 'Congelados' y no permiten el acceso a los usuarios asignados."
          type="info"
          showIcon
          icon={<RiInformationLine />}
        />
      </Space>

      <Modal
        title="Crear Nuevo Asiento"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateSeat}>
          <Form.Item
            name="name"
            label="Nombre del Asiento"
            rules={[{ required: true, message: "Por favor ingresa un nombre" }]}
          >
            <AntInput placeholder="Ej: Apartamento 101, Recepción..." />
          </Form.Item>
          <Form.Item
            name="seat_type_id"
            label="Tipo de Asiento"
            rules={[{ required: true, message: "Por favor selecciona un tipo" }]}
          >
            <Select loading={loadingTypes}>
              {seatTypes.map(type => (
                <Select.Option key={type.id} value={type.id}>
                  {type.name} - Capacidad: {type.default_capacity}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="capacity"
            label="Capacidad (Sobrescribir default)"
            tooltip="Número máximo de personas que pueden compartir este asiento"
          >
            <AntInput type="number" min={1} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
