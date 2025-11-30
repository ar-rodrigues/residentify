"use client";

import { useState } from "react";
import Image from "next/image";
import { Form, Input, Upload, Space, Typography, App, Modal, Card, Switch } from "antd";
import { RiUserLine, RiIdCardLine, RiUploadLine, RiDeleteBinLine, RiCameraLine, RiErrorWarningLine } from "react-icons/ri";
import InputComponent from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useStorageUpload } from "@/hooks/useStorageUpload";
import CameraCapture from "./CameraCapture";

const { TextArea } = Input;
const { Text } = Typography;

export default function QRValidationForm({ qrCode, onSubmit, onCancel, loading = false, error = null }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [documentFile, setDocumentFile] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [useCamera, setUseCamera] = useState(true); // true = camera, false = upload

  const { upload: uploadDocument, loading: uploadingDocument } = useStorageUpload({
    bucket: "documents",
    folder: "visitor-documents",
    public: false,
  });

  const handleFileChange = (info) => {
    const { fileList } = info;
    
    // Update form value with fileList
    form.setFieldsValue({ document_photo: fileList });

    if (fileList.length === 0) {
      setDocumentFile(null);
      setDocumentPreview(null);
      return;
    }

    const file = fileList[0].originFileObj || fileList[0];
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
    form.setFieldsValue({ document_photo: [] });
  };

  const handleCameraCapture = (file) => {
    setDocumentFile(file);
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setDocumentPreview(e.target.result);
    };
    reader.readAsDataURL(file);
    // Update form value
    form.setFieldsValue({ document_photo: [{ uid: Date.now(), name: file.name }] });
    // Close modal after capture
    setCameraModalOpen(false);
  };

  const handleCameraModalCancel = () => {
    setCameraModalOpen(false);
  };


  const handleSubmit = async (values) => {
    // Validate that either visitor_id OR document_photo is provided
    const visitorId = values.visitor_id?.trim() || "";
    if (!visitorId && !documentFile) {
      message.error("Debes proporcionar el número de documento o una foto del documento");
      return;
    }

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
      visitor_id: visitorId || null,
      document_photo_url: documentPhotoUrl,
      entry_type: "entry", // Always "entrada" in this mode
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
        document_photo: [],
      }}
    >
      <Form.Item
        name="visitor_name"
        label={<span className="text-sm sm:text-base">Nombre del Visitante</span>}
        rules={[
          { required: true, message: "El nombre del visitante es requerido" },
          { min: 2, message: "El nombre debe tener al menos 2 caracteres" },
        ]}
        className="mb-3 sm:mb-4"
      >
        <InputComponent
          prefixIcon={<RiUserLine />}
          placeholder="Nombre completo del visitante"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="visitor_id"
        label={<span className="text-sm sm:text-base">Número de Documento</span>}
        help={<span className="text-xs sm:text-sm">Opcional: Proporciona el número de documento o sube una foto del documento</span>}
        rules={[
          { 
            min: 3, 
            message: "El número de documento debe tener al menos 3 caracteres",
            validateTrigger: "onBlur"
          },
        ]}
        className="mb-3 sm:mb-4"
      >
        <InputComponent
          prefixIcon={<RiIdCardLine />}
          placeholder="Número de documento (opcional)"
          size="large"
        />
      </Form.Item>

      {documentPreview ? (
        <div className="mb-3 sm:mb-4">
          <div className="mb-2">
            <span className="text-sm sm:text-base font-medium">Foto del Documento</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 mb-2">
            Opcional: Toma una foto o sube una imagen del documento de identificación del visitante
          </div>
          <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={documentPreview}
              alt="Preview"
              fill
              className="object-contain"
              unoptimized
            />
            <Button
              type="text"
              danger
              icon={<RiDeleteBinLine />}
              onClick={handleRemoveFile}
              className="absolute top-2 right-2 bg-white/80 hover:bg-white z-10"
              size="small"
            />
          </div>
        </div>
      ) : (
        <Form.Item
          name="document_photo"
          label={<span className="text-sm sm:text-base">Foto del Documento</span>}
          help={<span className="text-xs sm:text-sm">Opcional: Toma una foto o sube una imagen del documento de identificación del visitante</span>}
          className="mb-3 sm:mb-4"
        >
          <Card className="w-full">
            <Space direction="vertical" size="middle" className="w-full">
              <div className="flex items-center justify-between">
                <Text className="text-sm sm:text-base">Modo:</Text>
                <Switch
                  checkedChildren="Cámara"
                  unCheckedChildren="Archivo"
                  checked={useCamera}
                  onChange={setUseCamera}
                />
              </div>
              
              {useCamera ? (
                <div
                  onClick={() => setCameraModalOpen(true)}
                  className="w-full h-32 sm:h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 hover:bg-gray-100"
                >
                  <RiCameraLine className="text-3xl sm:text-4xl text-gray-400 mb-2" />
                  <Text type="secondary" className="text-xs sm:text-sm">
                    Tomar foto
                  </Text>
                </div>
              ) : (
                <div 
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 hover:bg-gray-100"
                  style={{ height: "8rem" }}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileChange({ fileList: [{ originFileObj: file, uid: Date.now(), name: file.name }] });
                      }
                    };
                    input.click();
                  }}
                >
                  <RiUploadLine className="text-3xl sm:text-4xl text-gray-400 mb-2" />
                  <Text type="secondary" className="text-xs sm:text-sm">
                    Subir foto
                  </Text>
                </div>
              )}
            </Space>
          </Card>
        </Form.Item>
      )}

      <Modal
        open={cameraModalOpen}
        onCancel={handleCameraModalCancel}
        footer={null}
        width="100%"
        style={{ 
          maxWidth: "100vw", 
          top: 0, 
          paddingBottom: 0,
          margin: 0,
        }}
        styles={{
          body: { padding: 0, height: "calc(100vh - 64px)" },
          content: { padding: 0, height: "100vh", borderRadius: 0, maxWidth: "100vw" },
          header: { 
            padding: "20px 48px 24px 48px",
            textAlign: "center",
            borderBottom: "none",
            position: "relative",
          },
        }}
        title={
          <div className="absolute left-0 right-0 text-center">
            <span className="text-base sm:text-lg font-medium">
              Tomar Foto del Documento
            </span>
          </div>
        }
        maskClosable={false}
        closable={true}
      >
        <div style={{ width: "100%", height: "calc(100vh - 64px)" }}>
          <CameraCapture
            onCapture={handleCameraCapture}
            onCancel={handleCameraModalCancel}
          />
        </div>
      </Modal>

      <Form.Item
        name="notes"
        label={<span className="text-sm sm:text-base">Notas (opcional)</span>}
        className="mb-3 sm:mb-4"
      >
        <TextArea
          rows={3}
          placeholder="Notas adicionales sobre esta validación..."
          className="text-sm sm:text-base"
        />
      </Form.Item>

      <Form.Item className="mb-0 mt-4 sm:mt-6">
        <Space 
          direction="vertical" 
          size="middle" 
          className="w-full sm:flex sm:justify-end sm:flex-row"
        >
          {onCancel && (
            <Button 
              onClick={onCancel} 
              disabled={loading || uploadingDocument}
              block
              className="sm:w-auto"
            >
              Cancelar
            </Button>
          )}
          <Button
            type="primary"
            htmlType="submit"
            loading={loading || uploadingDocument}
            block
            className="sm:w-auto"
          >
            Validar y Registrar Acceso
          </Button>
          {error && (
            <div className="w-full flex items-center gap-2 text-red-500 text-sm sm:text-base animate-in fade-in duration-300">
              <RiErrorWarningLine className="text-base sm:text-lg" />
              <span>{error}</span>
            </div>
          )}
        </Space>
      </Form.Item>
    </Form>
  );
}

