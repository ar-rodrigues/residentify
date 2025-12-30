"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, Typography, Space, Alert, App, Spin } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiQrScanLine,
  RiCloseLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
} from "react-icons/ri";
import QRValidationForm from "../_components/widgets/residential/QRValidationForm";
import QRScanner from "../_components/widgets/residential/QRScanner";
import { useQRCodes } from "@/hooks/useQRCodes";
import Button from "@/components/ui/Button";

const { Title, Text } = Typography;

export default function ValidatePageClient({ organizationId }) {
  const t = useTranslations();
  const { message } = App.useApp();
  const [qrCode, setQrCode] = useState(null);
  const [error, setError] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [successMessageSmall, setSuccessMessageSmall] = useState(false);
  const [formError, setFormError] = useState(null);
  const { getQRCodeByToken, validateQRCode, loading } = useQRCodes();
  const processingTokenRef = useRef(null);
  const isProcessingRef = useRef(false);

  const extractToken = (scannedText) => {
    if (!scannedText) return null;
    if (!scannedText.includes("/")) {
      return scannedText;
    }
    const validateMatch = scannedText.match(/\/validate\/([^\/\?]+)/);
    if (validateMatch && validateMatch[1]) {
      return validateMatch[1];
    }
    const urlParts = scannedText.split("/");
    const lastPart = urlParts[urlParts.length - 1];
    return lastPart.split("?")[0];
  };

  const handleScan = async (scannedToken) => {
    if (isProcessingRef.current) {
      return;
    }

    const token = extractToken(scannedToken);

    if (!token) {
      setError(t("security.view.tokenExtractionError"));
      return;
    }

    if (processingTokenRef.current === token) {
      return;
    }

    isProcessingRef.current = true;
    processingTokenRef.current = token;

    setError(null);
    setQrCode(null);
    setValidationResult(null);
    setShowForm(false);

    try {
      const result = await getQRCodeByToken(token);
      if (result.error) {
        setError(result.message);
        setQrCode(null);
        processingTokenRef.current = null;
      } else {
        setQrCode(result.data);
        setError(null);
        setSuccessMessageSmall(false);
        setTimeout(() => {
          setShowForm(true);
        }, 1500);
        setTimeout(() => {
          setSuccessMessageSmall(true);
        }, 3000);
      }
    } catch (err) {
      console.error("[ValidatePage] Error processing scan:", err);
      setError(t("security.view.processingError"));
      processingTokenRef.current = null;
    } finally {
      isProcessingRef.current = false;
    }
  };

  const handleValidation = async (formData) => {
    if (!qrCode) return;

    setFormError(null);

    const result = await validateQRCode(qrCode.token, formData);
    if (result.error) {
      setFormError(result.message);
      setTimeout(() => {
        setFormError(null);
      }, 5000);
      message.error(result.message);
    } else {
      setShowForm(false);
      setValidationResult({
        success: true,
        message: result.message || t("security.view.validationSuccess"),
      });
      message.success(result.message);
    }
  };

  const handleReset = () => {
    setQrCode(null);
    setError(null);
    setValidationResult(null);
    setShowForm(false);
    setSuccessMessageSmall(false);
    processingTokenRef.current = null;
    isProcessingRef.current = false;
  };

  const handleScanAgain = () => {
    handleReset();
  };

  const handleConclude = () => {
    setTimeout(() => {
      handleReset();
    }, 400);
  };

  return (
    <div className="w-full">
      <Space
        orientation="vertical"
        size="middle"
        className="w-full sm:space-y-4"
      >
        <div>
          <Title level={4} className="mb-2 text-base sm:text-lg">
            {t("security.view.validateTitle")}
          </Title>
          <Text type="secondary" className="text-sm sm:text-base">
            {t("security.view.validateSubtitle")}
          </Text>
        </div>

        <AnimatePresence mode="wait">
          {!qrCode && !validationResult && !error && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <QRScanner onScan={handleScan} loading={loading} />
            </motion.div>
          )}

          {qrCode && !error && !validationResult && !formError && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                type: "spring",
                stiffness: 200,
                damping: 25,
              }}
            >
              <Card
                className={`border-green-500 transition-all duration-700 ${
                  successMessageSmall ? "py-2" : "py-6"
                }`}
              >
                <motion.div
                  animate={{
                    scale: successMessageSmall ? 0.85 : 1,
                  }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                >
                  <Space
                    orientation={
                      successMessageSmall ? "horizontal" : "vertical"
                    }
                    size={successMessageSmall ? "small" : "large"}
                    className={`w-full transition-all duration-700 ${
                      successMessageSmall
                        ? "items-center"
                        : "items-center justify-center"
                    }`}
                  >
                    <motion.div
                      animate={{
                        scale: successMessageSmall ? 0.4 : 1,
                      }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                    >
                      <RiCheckboxCircleLine
                        className={`text-green-500 transition-all duration-700 ${
                          successMessageSmall ? "text-xl" : "text-5xl"
                        }`}
                      />
                    </motion.div>
                    <motion.div
                      className={
                        successMessageSmall ? "text-left" : "text-center"
                      }
                      animate={{
                        opacity: 1,
                      }}
                      transition={{ duration: 0.6 }}
                    >
                      {successMessageSmall ? (
                        <Text type="success" className="text-xs sm:text-sm">
                          {t("security.view.qrDetected")}
                        </Text>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.6 }}
                        >
                          <Title
                            level={4}
                            className="mb-2 text-base sm:text-lg"
                          >
                            {t("security.view.qrDetected")}
                          </Title>
                          <Text type="success" className="text-sm sm:text-base">
                            {t("security.view.qrScannedSuccessfully")}
                          </Text>
                        </motion.div>
                      )}
                    </motion.div>
                  </Space>
                </motion.div>
              </Card>
            </motion.div>
          )}

          {qrCode && !error && formError && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Card className="border-red-500 py-4">
                <Space
                  orientation="vertical"
                  size="small"
                  className="w-full items-center"
                >
                  <RiCloseLine className="text-4xl text-red-500" />
                  <div className="text-center">
                    <Title level={4} className="mb-1 text-base sm:text-lg">
                      {t("security.view.validationError")}
                    </Title>
                    <Text type="danger" className="text-sm sm:text-base">
                      {formError}
                    </Text>
                  </div>
                </Space>
              </Card>
            </motion.div>
          )}

          {qrCode &&
            !error &&
            !qrCode.is_used &&
            !validationResult &&
            showForm && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.8,
                  ease: [0.16, 1, 0.3, 1],
                  type: "spring",
                  stiffness: 200,
                  damping: 25,
                }}
              >
                <Card
                  title={
                    <span className="text-sm sm:text-base">
                      {t("security.view.visitorInfo")}
                    </span>
                  }
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                  >
                    <QRValidationForm
                      qrCode={qrCode}
                      onSubmit={handleValidation}
                      onCancel={handleReset}
                      loading={loading}
                      error={formError}
                    />
                  </motion.div>
                </Card>
              </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error-display"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Card className="border-red-500">
                <Space
                  orientation="vertical"
                  size="large"
                  className="w-full items-center"
                >
                  <div className="flex items-center gap-3">
                    <RiErrorWarningLine className="text-4xl text-red-500" />
                    <div className="text-center sm:text-left">
                      <Title level={4} className="mb-1 text-base sm:text-lg">
                        {t("common.error")}
                      </Title>
                      <Text type="danger" className="text-sm sm:text-base">
                        {error}
                      </Text>
                    </div>
                  </div>

                  <Button
                    type="primary"
                    icon={<RiQrScanLine />}
                    onClick={handleScanAgain}
                    size="large"
                    className="w-full sm:w-auto"
                  >
                    {t("security.view.scanAnother")}
                  </Button>
                </Space>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {qrCode && !error && qrCode.is_used && !validationResult && (
            <motion.div
              key="already-used"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Card className="border-orange-500">
                <Space
                  orientation="vertical"
                  size="large"
                  className="w-full items-center"
                >
                  <div className="flex items-center gap-3">
                    <RiErrorWarningLine className="text-4xl text-orange-500" />
                    <div className="text-center sm:text-left">
                      <Title level={4} className="mb-1 text-base sm:text-lg">
                        {t("security.view.codeAlreadyUsed")}
                      </Title>
                      <Text type="warning" className="text-sm sm:text-base">
                        {t("security.view.codeAlreadyUsedMessage")}
                      </Text>
                    </div>
                  </div>

                  <Button
                    type="primary"
                    icon={<RiQrScanLine />}
                    onClick={handleScanAgain}
                    size="large"
                    className="w-full sm:w-auto"
                  >
                    {t("security.view.scanAnother")}
                  </Button>
                </Space>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {validationResult && validationResult.success && (
            <motion.div
              key="validation-result"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                type: "spring",
                stiffness: 200,
                damping: 25,
              }}
            >
              <Card className="border-green-500">
                <Space orientation="vertical" size="large" className="w-full">
                  <div className="flex items-center gap-3">
                    <RiCheckboxCircleLine className="text-4xl text-green-500" />
                    <div>
                      <Title level={4} className="mb-0">
                        {t("security.view.validationSuccessTitle")}
                      </Title>
                      <Text type="success">{validationResult.message}</Text>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="primary"
                      icon={<RiCheckboxCircleLine />}
                      onClick={handleConclude}
                    >
                      {t("security.view.conclude")}
                    </Button>
                  </div>
                </Space>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </Space>
    </div>
  );
}











