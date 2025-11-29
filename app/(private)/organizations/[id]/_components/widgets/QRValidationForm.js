"use client";

import { useState } from "react";
import { Form, Input, Upload, Space, Typography, App, Select } from "antd";
import { RiUserLine, RiIdCardLine, RiImageLine, RiUploadLine, RiDeleteBinLine } from "react-icons/ri";
import InputComponent from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useStorageUpload } from "@/hooks/useStorageUpload";

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

export default function QRValidationForm({ qrCode, onSubmit, onCancel, loading = false }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [documentFile, setDocumentFile] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);

  const { upload: uploadDocument, loading: uploadingDocument } = useStorageUpload({
    bucket: "documents",
    folder: "visitor-documents",
    public: false,
  });

  const handleFileChange = (info) => {
    if (info.file.status === "removed") {
      setDocumentFile(null);
      setDocumentPreview(null);
      form.setFieldsValue({ document_photo: null });
      return;
    }

    const file = info.file.originFileObj || info.file;
    if (file) {
      setDocumentFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setDocumentPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setDocumentFile(null);
    setDocumentPreview(null);
    form.setFieldsValue({ document_photo: null });
  };

  const handleSubmit = async (values) => {
    let documentPhotoUrl = null;

    // Upload document if provided
    if (documentFile) {
      const uploadResult = await uploadDocument(documentFile);
      if (uploadResult.error) {
        message.error(uploadResult.message);
        return;
      }
      documentPhotoUrl = uploadResult.data;
    }

    const formData = {
      visitor_name: values.visitor_name.trim(),
      visitor_id: values.visitor_id.trim(),
      document_photo_url: documentPhotoUrl,
      entry_type: values.entry_type || "entry",
      notes: values.notes || null,
    };

    await onSubmit(formData);
  };

  const uploadProps = {
    beforeUpload: () => false, // Prevent auto upload
    accept: "image/*",
    maxCount: 1,
    onChange: handleFileChange,
    onRemove: handleRemoveFile,
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        entry_type: "entry",
      }}
    >
      <Form.Item
        name="visitor_name"
        label="Nombre del Visitante"
        rules={[
          { required: true, message: "El nombre del visitante es requerido" },
          { min: 2, message: "El nombre debe tener al menos 2 caracteres" },
        ]}
      >
        <InputComponent
          prefixIcon={<RiUserLine />}
          placeholder="Nombre completo del visitante"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="visitor_id"
        label="ID del Visitante"
        rules={[
          { required: true, message: "El ID del visitante es requerido" },
          { min: 3, message: "El ID debe tener al menos 3 caracteres" },
        ]}
      >
        <InputComponent
          prefixIcon={<RiIdCardLine />}
          placeholder="Número de identificación"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="document_photo"
        label="Foto del Documento"
        help="Sube una foto del documento de identificación del visitante"
      >
        <Upload {...uploadProps} listType="picture-card" className="w-full">
          {documentPreview ? (
            <div className="relative w-full h-full">
              <img
                src={documentPreview}
                alt="Preview"
                className="w-full h-full object-cover rounded"
              />
              <Button
                type="text"
                danger
                icon={<RiDeleteBinLine />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                className="absolute top-2 right-2 bg-white/80 hover:bg-white"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-4">
              <RiUploadLine className="text-2xl text-gray-400 mb-2" />
              <Text type="secondary" className="text-sm">
                Subir foto
              </Text>
            </div>
          )}
        </Upload>
      </Form.Item>

      <Form.Item
        name="entry_type"
        label="Tipo de Acceso"
        rules={[{ required: true, message: "Selecciona el tipo de acceso" }]}
      >
        <Select size="large" placeholder="Selecciona el tipo de acceso">
          <Option value="entry">Entrada</Option>
          <Option value="exit">Salida</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="notes"
        label="Notas (opcional)"
      >
        <TextArea
          rows={3}
          placeholder="Notas adicionales sobre esta validación..."
        />
      </Form.Item>

      <Form.Item className="mb-0">
        <Space className="w-full justify-end">
          {onCancel && (
            <Button onClick={onCancel} disabled={loading || uploadingDocument}>
              Cancelar
            </Button>
          )}
          <Button
            type="primary"
            htmlType="submit"
            loading={loading || uploadingDocument}
          >
            Validar y Registrar Acceso
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}

