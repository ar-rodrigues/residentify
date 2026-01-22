"use client";

import { Modal, Typography, Space, Steps } from "antd";
import { useTranslations } from "next-intl";
import { RiShareBoxLine, RiAddBoxLine, RiCheckLine } from "react-icons/ri";

const { Title, Paragraph, Text } = Typography;

/**
 * Modal component showing PWA installation instructions
 * @param {boolean} open - Whether the modal is visible
 * @param {Function} onClose - Callback to close the modal
 * @param {boolean} isIOS - Whether the platform is iOS
 */
export default function PWAInstallInstructions({ open, onClose, isIOS = false }) {
  const t = useTranslations();

  const platformKey = isIOS ? "ios" : "android";

  const steps = [
    {
      title: t(`pwa.install.${platformKey}.step1`),
      icon: <RiShareBoxLine />,
      description: t(`pwa.install.${platformKey}.step1Description`),
    },
    {
      title: t(`pwa.install.${platformKey}.step2`),
      icon: <RiAddBoxLine />,
      description: t(`pwa.install.${platformKey}.step2Description`),
    },
    {
      title: t(`pwa.install.${platformKey}.step3`),
      icon: <RiCheckLine />,
      description: t(`pwa.install.${platformKey}.step3Description`),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <Title level={4} style={{ margin: 0, color: "var(--color-text-primary)" }}>
          {t(`pwa.install.${platformKey}.title`)}
        </Title>
      }
      footer={null}
      width={400}
      style={{
        maxWidth: "90vw",
      }}
      styles={{
        content: {
          backgroundColor: "var(--color-bg-elevated)",
        },
        header: {
          backgroundColor: "var(--color-bg-elevated)",
          borderBottom: "1px solid var(--color-border)",
        },
      }}
    >
      <Space orientation="vertical" size="large" className="w-full">
        <Paragraph style={{ color: "var(--color-text-secondary)", marginBottom: 0 }}>
          {t(`pwa.install.${platformKey}.description`)}
        </Paragraph>

        <Steps
          orientation="vertical"
          size="small"
          items={steps.map((step, index) => ({
            title: (
              <Text strong style={{ color: "var(--color-text-primary)" }}>
                {step.title}
              </Text>
            ),
            content: (
              <Text style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>
                {step.description}
              </Text>
            ),
            icon: (
              <div
                style={{
                  color: "var(--color-primary)",
                  fontSize: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {step.icon}
              </div>
            ),
            status: index === 0 ? "process" : "wait",
          }))}
        />

        <div
          style={{
            padding: "12px",
            borderRadius: "8px",
            backgroundColor: "var(--color-primary-bg)",
            border: "1px solid var(--color-primary-border)",
          }}
        >
          <Text
            style={{
              color: "var(--color-text-secondary)",
              fontSize: "12px",
            }}
          >
            {t(`pwa.install.${platformKey}.note`)}
          </Text>
        </div>
      </Space>
    </Modal>
  );
}
