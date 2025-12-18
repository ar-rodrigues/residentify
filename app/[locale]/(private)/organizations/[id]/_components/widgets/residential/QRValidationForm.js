"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Form,
  Input,
  Upload,
  Space,
  Typography,
  App,
  Modal,
  Card,
  Switch,
} from "antd";
import {
  RiUserLine,
  RiIdCardLine,
  RiUploadLine,
  RiDeleteBinLine,
  RiCameraLine,
  RiErrorWarningLine,
} from "react-icons/ri";
import InputComponent from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useStorageUpload } from "@/hooks/useStorageUpload";
import CameraCapture from "./CameraCapture";

const { TextArea } = Input;
const { Text } = Typography;

export default function QRValidationForm({
  qrCode,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
}) {
  const t = useTranslations();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [documentFile, setDocumentFile] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [useCamera, setUseCamera] = useState(true); // true = camera, false = upload

  const { upload: uploadDocument, loading: uploadingDocument } =
    useStorageUpload({
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
    form.setFieldsValue({
      document_photo: [{ uid: Date.now(), name: file.name }],
    });
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
      message.error(t("qrCodes.validation.errors.documentOrIdRequired"));
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
        label={
          <span className="text-sm sm:text-base">
            {t("qrCodes.validation.visitorName")}
          </span>
        }
        rules={[
          {
            required: true,
            message: t("qrCodes.validation.errors.visitorNameRequired"),
          },
          {
            min: 2,
            message: t("qrCodes.validation.errors.visitorNameMinLength"),
          },
        ]}
        className="mb-3 sm:mb-4"
      >
        <InputComponent
          prefixIcon={<RiUserLine />}
          placeholder={t("qrCodes.validation.visitorNamePlaceholder")}
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="visitor_id"
        label={
          <span className="text-sm sm:text-base">
            {t("qrCodes.validation.visitorId")}
          </span>
        }
        help={
          <span className="text-xs sm:text-sm">
            {t("qrCodes.validation.visitorIdHelp")}
          </span>
        }
        rules={[
          {
            min: 3,
            message: t("qrCodes.validation.errors.visitorIdMinLength"),
            validateTrigger: "onBlur",
          },
        ]}
        className="mb-3 sm:mb-4"
      >
        <InputComponent
          prefixIcon={<RiIdCardLine />}
          placeholder={t("qrCodes.validation.visitorIdPlaceholder")}
          size="large"
        />
      </Form.Item>

      {documentPreview ? (
        <div className="mb-3 sm:mb-4">
          <div className="mb-2">
            <span className="text-sm sm:text-base font-medium">
              {t("qrCodes.validation.documentPhoto")}
            </span>
          </div>
          <div
            className="text-xs sm:text-sm mb-2"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {t("qrCodes.validation.documentPhotoHelp")}
          </div>
          <div
            className="relative w-full aspect-video rounded-lg overflow-hidden"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <Image
              src={documentPreview}
              alt={t("qrCodes.validation.previewAlt")}
              fill
              className="object-contain"
              unoptimized
            />
            <div
              className="absolute bottom-4 left-1/2 z-10"
              style={{
                transform: "translateX(-50%)",
              }}
            >
              <Button
                type="default"
                icon={<RiDeleteBinLine />}
                onClick={handleRemoveFile}
                style={{
                  backgroundColor: "var(--color-bg-elevated)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid var(--color-border)",
                  minWidth: "160px",
                  height: "44px",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  color: "var(--color-text-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontSize: "15px",
                  fontWeight: "500",
                  opacity: "0.9",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--color-error)";
                  e.currentTarget.style.borderColor = "var(--color-error)";
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 16px rgba(0, 0, 0, 0.25)";
                  e.currentTarget.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--color-bg-elevated)";
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.color = "var(--color-text-primary)";
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0, 0, 0, 0.15)";
                  e.currentTarget.style.opacity = "0.9";
                }}
                size="large"
              >
                {t("qrCodes.validation.deletePhoto")}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Form.Item
          name="document_photo"
          label={
            <span className="text-sm sm:text-base">
              {t("qrCodes.validation.documentPhoto")}
            </span>
          }
          help={
            <span className="text-xs sm:text-sm">
              {t("qrCodes.validation.documentPhotoHelp")}
            </span>
          }
          className="mb-3 sm:mb-4"
        >
          <Card className="w-full">
            <Space orientation="vertical" size="middle" className="w-full">
              <div className="flex items-center justify-between">
                <Text className="text-sm sm:text-base">
                  {t("qrCodes.validation.mode")}:
                </Text>
                <Switch
                  checkedChildren={t("qrCodes.validation.camera")}
                  unCheckedChildren={t("qrCodes.validation.file")}
                  checked={useCamera}
                  onChange={setUseCamera}
                />
              </div>

              {useCamera ? (
                <div
                  onClick={() => setCameraModalOpen(true)}
                  className="w-full h-32 sm:h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-bg-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-primary)";
                    e.currentTarget.style.backgroundColor =
                      "var(--color-bg-elevated)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.backgroundColor =
                      "var(--color-bg-secondary)";
                  }}
                >
                  <RiCameraLine
                    className="text-3xl sm:text-4xl mb-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  />
                  <Text type="secondary" className="text-xs sm:text-sm">
                    {t("qrCodes.validation.takePhoto")}
                  </Text>
                </div>
              ) : (
                <div
                  className="w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors"
                  style={{
                    height: "8rem",
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-bg-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-primary)";
                    e.currentTarget.style.backgroundColor =
                      "var(--color-bg-elevated)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.backgroundColor =
                      "var(--color-bg-secondary)";
                  }}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileChange({
                          fileList: [
                            {
                              originFileObj: file,
                              uid: Date.now(),
                              name: file.name,
                            },
                          ],
                        });
                      }
                    };
                    input.click();
                  }}
                >
                  <RiUploadLine
                    className="text-3xl sm:text-4xl mb-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  />
                  <Text type="secondary" className="text-xs sm:text-sm">
                    {t("qrCodes.validation.uploadPhoto")}
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
          content: {
            padding: 0,
            height: "100vh",
            borderRadius: 0,
            maxWidth: "100vw",
          },
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
              {t("qrCodes.validation.takeDocumentPhoto")}
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
        label={
          <span className="text-sm sm:text-base">
            {t("qrCodes.validation.notes")}
          </span>
        }
        className="mb-3 sm:mb-4"
        rules={[
          {
            max: 500,
            message: t("qrCodes.validation.errors.notesMaxLength"),
            validateTrigger: "onBlur",
          },
        ]}
      >
        <TextArea
          rows={3}
          placeholder={t("qrCodes.validation.notesPlaceholder")}
          className="text-sm sm:text-base"
        />
      </Form.Item>

      <Form.Item className="mb-0 mt-4 sm:mt-6">
        <Space
          orientation="vertical"
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
              {t("qrCodes.validation.cancel")}
            </Button>
          )}
          <Button
            type="primary"
            htmlType="submit"
            loading={loading || uploadingDocument}
            block
            className="sm:w-auto"
          >
            {t("qrCodes.validation.submit")}
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
