"use client";

import { useState, useRef, useEffect } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Card, Space, Typography, Alert, App, Segmented } from "antd";
import {
  RiQrScanLine,
  RiCameraLine,
  RiKeyboardLine,
  RiSearchLine,
  RiFileImageLine,
} from "react-icons/ri";
import Button from "@/components/ui/Button";
import InputComponent from "@/components/ui/Input";
import jsQR from "jsqr";

const { Text } = Typography;

export default function QRScanner({ onScan, loading = false }) {
  const { message } = App.useApp();
  const [scanMode, setScanMode] = useState("camera"); // "camera" or "manual"
  const [manualToken, setManualToken] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  // Initialize cameraSupported based on secure context immediately
  const [cameraSupported, setCameraSupported] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.isSecureContext &&
      !!navigator.mediaDevices &&
      !!navigator.mediaDevices.getUserMedia
    );
  });
  const fileInputRef = useRef(null);
  const [processingImage, setProcessingImage] = useState(false);

  // Check for secure context and camera availability on mount - SET IMMEDIATELY
  useEffect(() => {
    // IMMEDIATELY check secure context - don't wait
    if (typeof window !== "undefined") {
      if (!window.isSecureContext) {
        setCameraSupported(false);
        return;
      }

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraSupported(false);
        return;
      }

      // Only proceed if we're in secure context
      const checkCameraSupport = async () => {
        try {
          // Check if we can enumerate devices (this doesn't require permission)
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasVideoDevice = devices.some(
            (device) => device.kind === "videoinput"
          );
          if (!hasVideoDevice) {
            setCameraSupported(false);
          }
        } catch (err) {
          // If enumeration fails, camera might not be available
          console.log("Camera enumeration failed, using fallback:", err);
          setCameraSupported(false);
        }
      };

      checkCameraSupport();
    }
  }, []);

  const handleScan = (result) => {
    // Handle different result formats
    let scannedText = null;

    if (typeof result === "string") {
      scannedText = result;
    } else if (result && result[0]) {
      // Array format
      scannedText = result[0].rawValue || result[0].value || result[0];
    } else if (result && result.rawValue) {
      scannedText = result.rawValue;
    } else if (result && result.value) {
      scannedText = result.value;
    }

    if (scannedText) {
      setIsScanning(false);
      if (onScan) {
        onScan(scannedText);
      }
    }
  };

  const handleError = (error) => {
    console.error("QR Scanner error:", error);
    setIsScanning(false);

    // Only set cameraSupported to false for actual unsupported errors
    const errorMessage = error?.message || "";
    const errorName = error?.name || "";

    // Handle secure context errors gracefully - show fallback instead of error
    if (
      errorMessage.includes("secure context") ||
      errorMessage.includes("not supported") ||
      errorMessage.includes("streaming not supported") ||
      errorMessage.includes("getUserMedia") ||
      errorName === "NotSupportedError" ||
      errorName === "SecurityError"
    ) {
      // For secure context and unsupported errors, gracefully switch to fallback
      setCameraSupported(false);
      setError(null); // Don't show error, show fallback UI instead
      message.info("Usando cámara del teléfono como alternativa");
      return;
    }

    if (
      errorMessage.includes("permission") ||
      errorName === "NotAllowedError"
    ) {
      // Permission denied - still allow fallback
      setCameraSupported(false);
      setError(null); // Don't show error, show fallback UI instead
      message.info("Usando cámara del teléfono como alternativa");
    } else if (
      errorMessage.includes("not found") ||
      errorName === "NotFoundError"
    ) {
      // Camera not found - allow fallback
      setCameraSupported(false);
      setError(null); // Don't show error, show fallback UI instead
      message.info("Usando cámara del teléfono como alternativa");
    } else {
      // For other errors, show error but don't break
      setError(
        "Error al iniciar el escáner. Puedes usar la cámara de tu teléfono o el modo manual."
      );
      message.warning("Error al iniciar el escáner");
      // Still allow fallback
      setCameraSupported(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualToken || manualToken.trim().length === 0) {
      message.warning("Por favor, ingresa un token");
      return;
    }
    if (onScan) {
      onScan(manualToken.trim());
    }
  };

  const toggleMode = () => {
    setScanMode(scanMode === "camera" ? "manual" : "camera");
    setError(null);
    setManualToken("");
    setIsScanning(false);
  };

  const startScanning = async () => {
    // CRITICAL: Check secure context FIRST - prevent any camera access attempt if not secure
    if (typeof window === "undefined" || !window.isSecureContext) {
      setCameraSupported(false);
      setIsScanning(false);
      setError(null);
      message.info("Usando cámara del teléfono como alternativa");
      return;
    }

    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraSupported(false);
      setIsScanning(false);
      setError(null);
      message.info("Usando cámara del teléfono como alternativa");
      return;
    }

    // Try to get camera permission first (this will catch secure context errors early)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      // If successful, stop the test stream and start scanning
      stream.getTracks().forEach((track) => track.stop());
      setIsScanning(true);
      setError(null);
    } catch (err) {
      // Camera access failed - use fallback gracefully
      // Suppress ALL errors - don't log secure context errors
      const errorName = err?.name || "";
      const errorMessage = err?.message || "";

      // Don't log secure context errors - they're expected
      if (
        !errorMessage.includes("secure context") &&
        errorName !== "SecurityError"
      ) {
        console.log("Camera access check failed, using fallback:", err);
      }

      setCameraSupported(false);
      setIsScanning(false);
      setError(null); // Don't show error
      message.info("Usando cámara del teléfono como alternativa");
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessingImage(true);
    setError(null);

    try {
      // Create an image element to load the file
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        // Create a canvas to draw the image
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Decode QR code from image
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

        // Clean up
        URL.revokeObjectURL(objectUrl);

        if (qrCode) {
          // QR code found
          if (onScan) {
            onScan(qrCode.data);
          }
          message.success("Código QR detectado");
        } else {
          // No QR code found
          setError(
            "No se pudo detectar un código QR en la imagen. Por favor, intenta con otra imagen o usa el modo manual."
          );
          message.warning("No se detectó código QR");
        }
        setProcessingImage(false);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setError(
          "Error al cargar la imagen. Por favor, intenta con otra imagen."
        );
        message.error("Error al procesar la imagen");
        setProcessingImage(false);
      };

      img.src = objectUrl;
    } catch (err) {
      console.error("Error processing image:", err);
      setError("Error al procesar la imagen. Por favor, intenta nuevamente.");
      message.error("Error al procesar la imagen");
      setProcessingImage(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openCameraFallback = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <Card className="w-full">
        <Space
          direction="vertical"
          size="large"
          className="w-full"
          style={{ width: "100%" }}
        >
          {/* Mode Toggle */}
          <div className="flex flex-col gap-2 w-full">
            <Text strong className="text-sm sm:text-base">
              Modo de Escaneo
            </Text>
            <Segmented
              options={[
                {
                  label: (
                    <Space size="small" className="flex items-center">
                      <RiCameraLine className="text-sm sm:text-base" />
                      <span className="text-xs sm:text-sm">Cámara</span>
                    </Space>
                  ),
                  value: "camera",
                  disabled: !cameraSupported,
                },
                {
                  label: (
                    <Space size="small" className="flex items-center">
                      <RiKeyboardLine className="text-sm sm:text-base" />
                      <span className="text-xs sm:text-sm">Manual</span>
                    </Space>
                  ),
                  value: "manual",
                },
              ]}
              value={scanMode}
              onChange={(value) => {
                if (isScanning && scanMode === "camera") {
                  stopScanning();
                }
                setScanMode(value);
                setError(null);
                setManualToken("");
              }}
              disabled={isScanning}
              block
              size="large"
              className="w-full"
            />
          </div>

          {/* Camera Scanner */}
          {scanMode === "camera" && cameraSupported && (
            <div className="w-full">
              {!isScanning ? (
                <div className="w-full flex flex-col items-center justify-center py-6 sm:py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 px-4">
                  <RiQrScanLine className="text-4xl sm:text-6xl text-gray-400 mb-4" />
                  <Button
                    type="primary"
                    icon={<RiQrScanLine />}
                    onClick={startScanning}
                    loading={loading}
                    size="large"
                    className="w-full sm:w-auto"
                  >
                    Iniciar Escaneo
                  </Button>
                </div>
              ) : (
                <div className="w-full">
                  <div
                    className="w-full rounded-lg overflow-hidden bg-black"
                    style={{
                      minHeight: "250px",
                      height: "50vh",
                      maxHeight: "500px",
                      position: "relative",
                    }}
                  >
                    {isScanning &&
                      cameraSupported &&
                      typeof window !== "undefined" &&
                      window.isSecureContext &&
                      navigator.mediaDevices &&
                      navigator.mediaDevices.getUserMedia && (
                        <Scanner
                          onScan={handleScan}
                          onError={handleError}
                          constraints={{
                            facingMode: "environment", // Use back camera on mobile
                          }}
                          scanDelay={300}
                        />
                      )}
                  </div>
                  <div className="mt-4">
                    <Button danger onClick={stopScanning} block size="large">
                      Detener Escaneo
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual Input */}
          {scanMode === "manual" && (
            <div className="w-full">
              <InputComponent
                prefixIcon={<RiQrScanLine />}
                placeholder="Ingresa el token del código QR"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                onPressEnter={handleManualSubmit}
                size="large"
                className="w-full"
              />
              <div className="mt-4">
                <Button
                  type="primary"
                  icon={<RiSearchLine />}
                  onClick={handleManualSubmit}
                  loading={loading}
                  block
                  size="large"
                >
                  Buscar
                </Button>
              </div>
            </div>
          )}

          {/* Camera Fallback - Show when camera is not supported or when there's a camera error */}
          {scanMode === "camera" && !cameraSupported && (
            <div className="w-full">
              <div className="w-full flex flex-col items-center justify-center py-6 sm:py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 px-4">
                <RiCameraLine className="text-4xl sm:text-6xl text-gray-400 mb-4" />
                <p className="mb-4 text-gray-500 text-center text-sm sm:text-base px-2">
                  La cámara del navegador no está disponible. Puedes usar la
                  cámara de tu teléfono para tomar una foto del código QR.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
                <Button
                  type="primary"
                  icon={<RiFileImageLine />}
                  onClick={openCameraFallback}
                  loading={processingImage}
                  size="large"
                  className="w-full sm:w-auto"
                >
                  Abrir Cámara
                </Button>
              </div>
            </div>
          )}

          {/* Error Display - Only show if not using fallback */}
          {error && !(scanMode === "camera" && !cameraSupported) && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
              action={
                scanMode === "camera" && (
                  <Button
                    type="link"
                    size="small"
                    icon={<RiFileImageLine />}
                    onClick={openCameraFallback}
                    loading={processingImage}
                  >
                    Intentar con Cámara
                  </Button>
                )
              }
            />
          )}
        </Space>
      </Card>
    </div>
  );
}
