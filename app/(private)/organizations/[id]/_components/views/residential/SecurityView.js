"use client";

import { useState, useRef } from "react";
import { Card, Typography, Space, Alert, App, Tabs } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiQrScanLine,
  RiCloseLine,
  RiHistoryLine,
  RiFileListLine,
  RiRefreshLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
} from "react-icons/ri";
import QRValidationForm from "../../widgets/residential/QRValidationForm";
import QRScanner from "../../widgets/residential/QRScanner";
import PendingCodesList from "../../widgets/residential/PendingCodesList";
import AccessHistoryList from "../../widgets/residential/AccessHistoryList";
import { useQRCodes } from "@/hooks/useQRCodes";
import Button from "@/components/ui/Button";

const { Title, Text } = Typography;

export default function SecurityView({ organizationId }) {
  const { message } = App.useApp();
  const [qrCode, setQrCode] = useState(null);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [validationResult, setValidationResult] = useState(null); // { success: boolean, message: string }
  const [showForm, setShowForm] = useState(false);
  const [successMessageSmall, setSuccessMessageSmall] = useState(false);
  const [formError, setFormError] = useState(null); // Error message for form
  const { getQRCodeByToken, validateQRCode, loading } = useQRCodes();
  const processingTokenRef = useRef(null);
  const isProcessingRef = useRef(false);

  // Extract token from URL if scanned text is a full URL
  const extractToken = (scannedText) => {
    if (!scannedText) return null;

    // If it's already just a token (no slashes), return it
    if (!scannedText.includes("/")) {
      return scannedText;
    }

    // Try to extract token from URL pattern: .../validate/TOKEN
    const validateMatch = scannedText.match(/\/validate\/([^\/\?]+)/);
    if (validateMatch && validateMatch[1]) {
      return validateMatch[1];
    }

    // If it's a URL but doesn't match the pattern, try to get the last segment
    const urlParts = scannedText.split("/");
    const lastPart = urlParts[urlParts.length - 1];

    // Remove query parameters if any
    return lastPart.split("?")[0];
  };

  const handleScan = async (scannedToken) => {
    // Prevent duplicate processing
    if (isProcessingRef.current) {
      console.log(
        "[SecurityView] DEBUG: Already processing a scan, ignoring duplicate"
      );
      return;
    }

    // Extract token from scanned text (might be a full URL)
    const token = extractToken(scannedToken);

    if (!token) {
      setError("No se pudo extraer el token del código QR escaneado.");
      return;
    }

    // Prevent processing the same token multiple times
    if (processingTokenRef.current === token) {
      console.log(
        "[SecurityView] DEBUG: Token already processed, ignoring duplicate:",
        token
      );
      return;
    }

    // Set processing flags
    isProcessingRef.current = true;
    processingTokenRef.current = token;

    setError(null);
    setQrCode(null);
    setValidationResult(null);
    setShowForm(false);

    console.log(
      "[SecurityView] DEBUG: Extracted token:",
      token,
      "from scanned:",
      scannedToken
    );

    try {
      const result = await getQRCodeByToken(token);
      if (result.error) {
        setError(result.message);
        setQrCode(null);
        // Reset processing flags on error so user can retry
        processingTokenRef.current = null;
      } else {
        setQrCode(result.data);
        setError(null);
        setSuccessMessageSmall(false);
        // Show success message first, then transition to form after delay
        setTimeout(() => {
          setShowForm(true);
        }, 1500);
        // Make success message small after 3 seconds
        setTimeout(() => {
          setSuccessMessageSmall(true);
        }, 3000);
      }
    } catch (err) {
      console.error("[SecurityView] DEBUG: Error processing scan:", err);
      setError("Error al procesar el código QR escaneado.");
      processingTokenRef.current = null;
    } finally {
      isProcessingRef.current = false;
    }
  };

  const handleValidation = async (formData) => {
    if (!qrCode) return;

    // Clear previous form error
    setFormError(null);

    const result = await validateQRCode(qrCode.token, formData);
    if (result.error) {
      // Set form error that will disappear after 5s
      setFormError(result.message);
      setTimeout(() => {
        setFormError(null);
      }, 5000);
      // Don't set validationResult on error - keep form visible
      message.error(result.message);
    } else {
      setShowForm(false); // Hide form immediately when validation succeeds
      setValidationResult({
        success: true,
        message: result.message || "Código QR validado exitosamente.",
      });
      message.success(result.message);
      // Refresh pending codes
      setRefreshKey((prev) => prev + 1);
      // Don't reset qrCode yet - show success state
    }
  };

  const handleReset = () => {
    setQrCode(null);
    setError(null);
    setValidationResult(null);
    setShowForm(false);
    setSuccessMessageSmall(false);
    // Reset processing flags to allow new scans
    processingTokenRef.current = null;
    isProcessingRef.current = false;
  };

  const handleScanAgain = () => {
    handleReset();
  };

  const handleConclude = () => {
    // Add delay to allow exit animation to complete before resetting
    setTimeout(() => {
      handleReset();
      setRefreshKey((prev) => prev + 1);
    }, 400);
  };

  const tabItems = [
    {
      key: "validate",
      label: (
        <Space>
          <RiQrScanLine />
          <span>Validar</span>
        </Space>
      ),
      children: (
        <div className="w-full">
          <Space
            orientation="vertical"
            size="middle"
            className="w-full sm:space-y-4"
          >
            <div>
              <Title level={4} className="mb-2 text-base sm:text-lg">
                Validar Código QR
              </Title>
              <Text type="secondary" className="text-sm sm:text-base">
                Escanea o ingresa el token del código QR para validar el acceso
                del visitante
              </Text>
            </div>

            {/* Scanner - Show scanner when no QR code, no validation result, and no error */}
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

              {/* Success Message - Show after scan, stays visible but gets smaller */}
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
                              Código QR Detectado
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
                                Código QR Detectado
                              </Title>
                              <Text
                                type="success"
                                className="text-sm sm:text-base"
                              >
                                El código QR se ha escaneado correctamente
                              </Text>
                            </motion.div>
                          )}
                        </motion.div>
                      </Space>
                    </motion.div>
                  </Card>
                </motion.div>
              )}

              {/* Error Message - Show when validation fails, replaces success message */}
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
                          Error en la Validación
                        </Title>
                        <Text type="danger" className="text-sm sm:text-base">
                          {formError}
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </motion.div>
              )}

              {/* Validation Form - Show in place of scanner after success */}
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
                          Información del Visitante
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

            {/* Error Display - Including already used codes */}
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
                          <Title
                            level={4}
                            className="mb-1 text-base sm:text-lg"
                          >
                            Error
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
                        Escanear otro código
                      </Button>
                    </Space>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Already Used Message - When QR code is found but already used */}
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
                          <Title
                            level={4}
                            className="mb-1 text-base sm:text-lg"
                          >
                            Código ya utilizado
                          </Title>
                          <Text type="warning" className="text-sm sm:text-base">
                            Este código QR ya ha sido validado y utilizado
                            anteriormente.
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
                        Escanear otro código
                      </Button>
                    </Space>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Validation Result - Only show on success */}
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
                    <Space
                      orientation="vertical"
                      size="large"
                      className="w-full"
                    >
                      <div className="flex items-center gap-3">
                        <RiCheckboxCircleLine className="text-4xl text-green-500" />
                        <div>
                          <Title level={4} className="mb-0">
                            Validación Exitosa
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
                          Concluir
                        </Button>
                      </div>
                    </Space>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </Space>
        </div>
      ),
    },
    {
      key: "history",
      label: (
        <Space>
          <RiHistoryLine />
          <span>Historial</span>
        </Space>
      ),
      children: <AccessHistoryList organizationId={organizationId} />,
    },
    {
      key: "pending",
      label: (
        <Space>
          <RiFileListLine />
          <span>Pendientes</span>
        </Space>
      ),
      children: (
        <PendingCodesList
          organizationId={organizationId}
          onRefresh={refreshKey}
        />
      ),
    },
  ];

  return (
    <div className="w-full">
      <Card className="w-full">
        <Tabs defaultActiveKey="validate" items={tabItems} />
      </Card>
    </div>
  );
}
