"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Scanner } from "@yudiel/react-qr-scanner";
import NextImage from "next/image";
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

// Custom scan sound function using Web Audio API
// Creates a pleasant two-tone beep sound for successful scans
const playScanSound = () => {
  try {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    // First tone - higher pitch
    const oscillator1 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    oscillator1.connect(gainNode1);
    gainNode1.connect(audioContext.destination);

    oscillator1.frequency.value = 800; // First tone frequency
    oscillator1.type = "sine";

    // Second tone - slightly lower pitch, starts after first
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();
    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);

    oscillator2.frequency.value = 1000; // Second tone frequency (higher)
    oscillator2.type = "sine";

    const now = audioContext.currentTime;

    // First tone envelope
    gainNode1.gain.setValueAtTime(0, now);
    gainNode1.gain.linearRampToValueAtTime(0.25, now + 0.01);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    // Second tone envelope (starts slightly after first)
    gainNode2.gain.setValueAtTime(0, now + 0.05);
    gainNode2.gain.linearRampToValueAtTime(0.25, now + 0.06);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    // Play both tones
    oscillator1.start(now);
    oscillator1.stop(now + 0.1);

    oscillator2.start(now + 0.05);
    oscillator2.stop(now + 0.15);

    // Clean up after sound finishes
    setTimeout(() => {
      audioContext.close();
    }, 200);
  } catch (error) {
    // Silently fail if audio context is not available
    console.log("[QRScanner] Audio not available:", error);
  }
};

export default function QRScanner({ onScan, loading = false }) {
  const t = useTranslations();
  const { message } = App.useApp();
  const [scanMode, setScanMode] = useState("camera"); // "camera" or "manual"
  const [manualToken, setManualToken] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  // Initialize cameraSupported based on secure context immediately
  const [cameraSupported, setCameraSupported] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const isSecure = window.isSecureContext;
    const hasMediaDevices = !!navigator.mediaDevices;
    const hasGetUserMedia = !!navigator.mediaDevices?.getUserMedia;
    const supported = isSecure && hasMediaDevices && hasGetUserMedia;
    return supported;
  });
  const fileInputRef = useRef(null);
  const scannerAreaRef = useRef(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

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
      // Play custom scan sound
      playScanSound();
      if (onScan) {
        onScan(scannedText);
      }
    }
  };

  const handleError = (error) => {
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
      message.info(t("qrCodes.scanner.usingPhoneCamera"));
      return;
    }

    if (
      errorMessage.includes("permission") ||
      errorName === "NotAllowedError"
    ) {
      // Permission denied - still allow fallback
      setCameraSupported(false);
      setError(null); // Don't show error, show fallback UI instead
      message.info(t("qrCodes.scanner.usingPhoneCamera"));
    } else if (
      errorMessage.includes("not found") ||
      errorName === "NotFoundError"
    ) {
      // Camera not found - allow fallback
      setCameraSupported(false);
      setError(null); // Don't show error, show fallback UI instead
      message.info(t("qrCodes.scanner.usingPhoneCamera"));
    } else {
      // For other errors, show error but don't break
      setError(t("qrCodes.scanner.startError"));
      message.warning(t("qrCodes.scanner.startErrorTitle"));
      // Still allow fallback
      setCameraSupported(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualToken || manualToken.trim().length === 0) {
      message.warning(t("qrCodes.scanner.tokenRequired"));
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
      message.info(t("qrCodes.scanner.usingPhoneCamera"));
      return;
    }

    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraSupported(false);
      setIsScanning(false);
      setError(null);
      message.info(t("qrCodes.scanner.usingPhoneCamera"));
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

      // Scroll to scanning area after a short delay to ensure DOM has updated
      setTimeout(() => {
        if (scannerAreaRef.current) {
          scannerAreaRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
        }
      }, 100);
    } catch (err) {
      // Camera access failed - use fallback gracefully
      setCameraSupported(false);
      setIsScanning(false);
      setError(null); // Don't show error
      message.info(t("qrCodes.scanner.usingPhoneCamera"));
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  // Helper function to resize image for faster processing
  const resizeImage = (img, maxDimension = 1000) => {
    let { width, height } = img;

    // Calculate new dimensions maintaining aspect ratio
    if (width > height) {
      if (width > maxDimension) {
        height = (height * maxDimension) / width;
        width = maxDimension;
      }
    } else {
      if (height > maxDimension) {
        width = (width * maxDimension) / height;
        height = maxDimension;
      }
    }

    // Create canvas with optimized size
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width);
    canvas.height = Math.round(height);
    const ctx = canvas.getContext("2d", { willReadFrequently: false });

    // Use high-quality image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Draw resized image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return canvas;
  };

  // Define processFile and handleFileSelect before useEffect that uses them
  const processFile = useCallback(
    async (file) => {
      setProcessingImage(true);
      setError(null);
      message.info({
        content: t("qrCodes.scanner.processingImage"),
        duration: 0,
        key: "processing",
      });

      try {
        // Create an image element to load the file
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
          // Use requestAnimationFrame to avoid blocking the UI
          requestAnimationFrame(() => {
            try {
              // Resize image to max 1000px for faster processing
              const canvas = resizeImage(img, 1000);

              // Get image data from resized canvas
              const ctx = canvas.getContext("2d");
              const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
              );

              // Decode QR code from image
              let qrCode = jsQR(
                imageData.data,
                imageData.width,
                imageData.height
              );

              // If not found, try with a smaller size (sometimes helps with detection)
              if (!qrCode && (canvas.width > 500 || canvas.height > 500)) {
                const smallerCanvas = resizeImage(img, 500);
                const smallerCtx = smallerCanvas.getContext("2d");
                const smallerImageData = smallerCtx.getImageData(
                  0,
                  0,
                  smallerCanvas.width,
                  smallerCanvas.height
                );
                qrCode = jsQR(
                  smallerImageData.data,
                  smallerImageData.width,
                  smallerImageData.height
                );
              }

              // Dismiss loading message
              message.destroy("processing");

              // Clean up object URL after a short delay to allow preview
              setTimeout(() => {
                URL.revokeObjectURL(objectUrl);
                setImagePreview(null);
              }, 2000);

              if (qrCode) {
                // QR code found
                // Play custom scan sound
                playScanSound();
                if (onScan) {
                  onScan(qrCode.data);
                  // Don't show notification here - SecurityView will show success card
                }
              } else {
                // No QR code found
                setError(t("qrCodes.scanner.noQRDetected"));
                message.warning(t("qrCodes.scanner.noQRDetectedTitle"));
              }
              setProcessingImage(false);
            } catch (err) {
              URL.revokeObjectURL(objectUrl);
              message.destroy("processing");
              setError(t("qrCodes.scanner.processingError"));
              message.error(t("qrCodes.scanner.processingErrorTitle"));
              setProcessingImage(false);
            }
          });
        };

        img.onerror = (error) => {
          URL.revokeObjectURL(objectUrl);
          message.destroy("processing");
          setError(t("qrCodes.scanner.loadError"));
          message.error(t("qrCodes.scanner.processingErrorTitle"));
          setProcessingImage(false);
        };

        img.src = objectUrl;
      } catch (err) {
        message.destroy("processing");
        setImagePreview(null);
        setError(t("qrCodes.scanner.processingError"));
        message.error(t("qrCodes.scanner.processingErrorTitle"));
        setProcessingImage(false);
      }

      // Reset file input after a delay to ensure processing is complete
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 100);
    },
    [onScan, message]
  );

  const handleFileSelect = useCallback(
    async (event) => {
      // Try both event.target and fileInputRef.current
      const files = event.target?.files || fileInputRef.current?.files;
      const file = files?.[0];

      if (!file) {
        // Double check the ref directly
        if (fileInputRef.current?.files?.length > 0) {
          const refFile = fileInputRef.current.files[0];
          // Process the file from ref
          await processFile(refFile);
        }
        return;
      }

      await processFile(file);
    },
    [processFile]
  );

  // Attach event listeners directly to file input for better mobile support
  useEffect(() => {
    const fileInput = fileInputRef.current;
    if (!fileInput) {
      return;
    }

    const handleInput = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelect(e);
      }
    };

    const handleChange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelect(e);
      }
    };

    // Add both input and change listeners for maximum compatibility
    fileInput.addEventListener("input", handleInput);
    fileInput.addEventListener("change", handleChange);

    return () => {
      fileInput.removeEventListener("input", handleInput);
      fileInput.removeEventListener("change", handleChange);
    };
  }, [handleFileSelect]);

  const openCameraFallback = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <Card className="w-full">
        <Space
          orientation="vertical"
          size="large"
          className="w-full"
          style={{ width: "100%" }}
        >
          {/* Mode Toggle */}
          <div className="flex flex-col gap-2 w-full">
            <Text strong className="text-sm sm:text-base">
              {t("qrCodes.scanner.scanMode")}
            </Text>
            <Segmented
              options={[
                {
                  label: (
                    <Space size="small" className="flex items-center">
                      <RiCameraLine className="text-sm sm:text-base" />
                      <span className="text-xs sm:text-sm">
                        {t("qrCodes.scanner.camera")}
                      </span>
                    </Space>
                  ),
                  value: "camera",
                  disabled: !cameraSupported,
                },
                {
                  label: (
                    <Space size="small" className="flex items-center">
                      <RiKeyboardLine className="text-sm sm:text-base" />
                      <span className="text-xs sm:text-sm">
                        {t("qrCodes.scanner.manual")}
                      </span>
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
                <div
                  className="w-full flex flex-col items-center justify-center py-6 sm:py-8 rounded-lg border-2 border-dashed px-4"
                  style={{
                    backgroundColor: "var(--color-bg-secondary)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <RiQrScanLine
                    className="text-4xl sm:text-6xl mb-4"
                    style={{ color: "var(--color-text-secondary)" }}
                  />
                  <Button
                    type="primary"
                    icon={<RiQrScanLine />}
                    onClick={startScanning}
                    loading={loading}
                    size="large"
                    className="w-full sm:w-auto"
                  >
                    {t("qrCodes.scanner.startScan")}
                  </Button>
                </div>
              ) : (
                <div className="w-full" ref={scannerAreaRef}>
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
                          key={`scanner-${isScanning}`}
                          onScan={handleScan}
                          onError={handleError}
                          constraints={{
                            facingMode: "environment", // Use back camera on mobile
                          }}
                          scanDelay={300}
                          sound={false} // Disable default sound - we use custom sound
                        />
                      )}
                  </div>
                  <div className="mt-4">
                    <Button danger onClick={stopScanning} block size="large">
                      {t("qrCodes.scanner.stopScan")}
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
                placeholder={t("qrCodes.scanner.manualPlaceholder")}
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
                  {t("qrCodes.scanner.search")}
                </Button>
              </div>
            </div>
          )}

          {/* Image Preview */}
          {imagePreview && (
            <div className="w-full">
              <Card title={t("qrCodes.scanner.capturedImage")}>
                <div
                  className="w-full flex justify-center relative"
                  style={{ minHeight: "200px", maxHeight: "256px" }}
                >
                  <NextImage
                    src={imagePreview}
                    alt={t("qrCodes.scanner.previewAlt")}
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              </Card>
            </div>
          )}

          {/* Camera Fallback - Show when camera is not supported or when there's a camera error */}
          {scanMode === "camera" && !cameraSupported && (
            <div className="w-full">
              <div
                className="w-full flex flex-col items-center justify-center py-6 sm:py-8 rounded-lg border-2 border-dashed px-4"
                style={{
                  backgroundColor: "var(--color-bg-secondary)",
                  borderColor: "var(--color-border)",
                }}
              >
                <RiCameraLine
                  className="text-4xl sm:text-6xl mb-4"
                  style={{ color: "var(--color-text-secondary)" }}
                />
                <p
                  className="mb-4 text-center text-sm sm:text-base px-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {t("qrCodes.scanner.cameraNotAvailable")}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    handleFileSelect(e);
                  }}
                  onInput={(e) => {
                    handleFileSelect(e);
                  }}
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
                  {t("qrCodes.scanner.openCamera")}
                </Button>
              </div>
            </div>
          )}

          {/* Error Display - Only show if not using fallback */}
          {error && !(scanMode === "camera" && !cameraSupported) && (
            <Alert
              title={t("common.error")}
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
                    {t("qrCodes.scanner.tryWithCamera")}
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
