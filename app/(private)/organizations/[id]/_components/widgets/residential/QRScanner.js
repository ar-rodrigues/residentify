"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import Image from "next/image";
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
  const { message } = App.useApp();
  const [scanMode, setScanMode] = useState("camera"); // "camera" or "manual"
  const [manualToken, setManualToken] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  // Initialize cameraSupported based on secure context immediately
  const [cameraSupported, setCameraSupported] = useState(() => {
    if (typeof window === "undefined") {
      console.log(
        "[QRScanner] DEBUG: window is undefined, cameraSupported = false"
      );
      return false;
    }
    const isSecure = window.isSecureContext;
    const hasMediaDevices = !!navigator.mediaDevices;
    const hasGetUserMedia = !!navigator.mediaDevices?.getUserMedia;
    const supported = isSecure && hasMediaDevices && hasGetUserMedia;
    console.log("[QRScanner] DEBUG: Initial camera support check:", {
      isSecureContext: isSecure,
      hasMediaDevices,
      hasGetUserMedia,
      cameraSupported: supported,
    });
    return supported;
  });
  const fileInputRef = useRef(null);
  const scannerAreaRef = useRef(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Check for secure context and camera availability on mount - SET IMMEDIATELY
  useEffect(() => {
    console.log(
      "[QRScanner] DEBUG: useEffect - Checking camera support on mount"
    );
    // IMMEDIATELY check secure context - don't wait
    if (typeof window !== "undefined") {
      if (!window.isSecureContext) {
        console.log(
          "[QRScanner] DEBUG: Not in secure context, setting cameraSupported = false"
        );
        setCameraSupported(false);
        return;
      }

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log(
          "[QRScanner] DEBUG: getUserMedia not available, setting cameraSupported = false"
        );
        setCameraSupported(false);
        return;
      }

      // Only proceed if we're in secure context
      const checkCameraSupport = async () => {
        try {
          console.log("[QRScanner] DEBUG: Enumerating devices...");
          // Check if we can enumerate devices (this doesn't require permission)
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasVideoDevice = devices.some(
            (device) => device.kind === "videoinput"
          );
          console.log("[QRScanner] DEBUG: Device enumeration result:", {
            totalDevices: devices.length,
            videoDevices: devices.filter((d) => d.kind === "videoinput").length,
            hasVideoDevice,
          });
          if (!hasVideoDevice) {
            console.log(
              "[QRScanner] DEBUG: No video device found, setting cameraSupported = false"
            );
            setCameraSupported(false);
          } else {
            console.log(
              "[QRScanner] DEBUG: Video device found, cameraSupported remains true"
            );
          }
        } catch (err) {
          // If enumeration fails, camera might not be available
          console.log(
            "[QRScanner] DEBUG: Camera enumeration failed, using fallback:",
            err
          );
          setCameraSupported(false);
        }
      };

      checkCameraSupport();
    } else {
      console.log("[QRScanner] DEBUG: window is undefined in useEffect");
    }
  }, []);

  // Debug state changes
  useEffect(() => {
    console.log(
      "[QRScanner] DEBUG: cameraSupported state changed to:",
      cameraSupported
    );
  }, [cameraSupported]);

  useEffect(() => {
    console.log("[QRScanner] DEBUG: isScanning state changed to:", isScanning);
  }, [isScanning]);

  useEffect(() => {
    console.log("[QRScanner] DEBUG: scanMode state changed to:", scanMode);
  }, [scanMode]);

  useEffect(() => {
    console.log(
      "[QRScanner] DEBUG: processingImage state changed to:",
      processingImage
    );
  }, [processingImage]);

  const handleScan = (result) => {
    console.log("[QRScanner] DEBUG: handleScan called with result:", result);
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

    console.log("[QRScanner] DEBUG: Extracted scannedText:", scannedText);

    if (scannedText) {
      setIsScanning(false);
      // Play custom scan sound
      playScanSound();
      if (onScan) {
        console.log(
          "[QRScanner] DEBUG: Calling onScan callback with:",
          scannedText
        );
        onScan(scannedText);
      } else {
        console.log("[QRScanner] DEBUG: onScan callback is not defined!");
      }
    } else {
      console.log("[QRScanner] DEBUG: No scannedText extracted from result");
    }
  };

  const handleError = (error) => {
    console.error("[QRScanner] DEBUG: handleError called with:", error);
    setIsScanning(false);

    // Only set cameraSupported to false for actual unsupported errors
    const errorMessage = error?.message || "";
    const errorName = error?.name || "";

    console.log("[QRScanner] DEBUG: Error details:", {
      errorName,
      errorMessage,
      errorObject: error,
    });

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
      console.log(
        "[QRScanner] DEBUG: Security/NotSupported error detected, switching to fallback"
      );
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
      console.log(
        "[QRScanner] DEBUG: Permission denied, switching to fallback"
      );
      setCameraSupported(false);
      setError(null); // Don't show error, show fallback UI instead
      message.info("Usando cámara del teléfono como alternativa");
    } else if (
      errorMessage.includes("not found") ||
      errorName === "NotFoundError"
    ) {
      // Camera not found - allow fallback
      console.log("[QRScanner] DEBUG: Camera not found, switching to fallback");
      setCameraSupported(false);
      setError(null); // Don't show error, show fallback UI instead
      message.info("Usando cámara del teléfono como alternativa");
    } else {
      // For other errors, show error but don't break
      console.log("[QRScanner] DEBUG: Other error, switching to fallback");
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
    console.log("[QRScanner] DEBUG: startScanning called");
    // CRITICAL: Check secure context FIRST - prevent any camera access attempt if not secure
    if (typeof window === "undefined" || !window.isSecureContext) {
      console.log(
        "[QRScanner] DEBUG: startScanning - Not in secure context or window undefined"
      );
      setCameraSupported(false);
      setIsScanning(false);
      setError(null);
      message.info("Usando cámara del teléfono como alternativa");
      return;
    }

    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log(
        "[QRScanner] DEBUG: startScanning - getUserMedia not available"
      );
      setCameraSupported(false);
      setIsScanning(false);
      setError(null);
      message.info("Usando cámara del teléfono como alternativa");
      return;
    }

    // Try to get camera permission first (this will catch secure context errors early)
    try {
      console.log(
        "[QRScanner] DEBUG: startScanning - Attempting to get camera stream..."
      );
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      console.log(
        "[QRScanner] DEBUG: startScanning - Camera stream obtained successfully"
      );
      // If successful, stop the test stream and start scanning
      stream.getTracks().forEach((track) => track.stop());
      setIsScanning(true);
      setError(null);
      console.log("[QRScanner] DEBUG: startScanning - isScanning set to true");

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
      const errorName = err?.name || "";
      const errorMessage = err?.message || "";

      console.log("[QRScanner] DEBUG: startScanning - Camera access failed:", {
        errorName,
        errorMessage,
        error: err,
      });

      setCameraSupported(false);
      setIsScanning(false);
      setError(null); // Don't show error
      message.info("Usando cámara del teléfono como alternativa");
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
      console.log("[QRScanner] DEBUG: processFile called with file:", {
        name: file.name,
        type: file.type,
        size: file.size,
      });

      setProcessingImage(true);
      setError(null);
      message.info({
        content: "Procesando imagen...",
        duration: 0,
        key: "processing",
      });

      try {
        // Create an image element to load the file
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        console.log("[QRScanner] DEBUG: Created object URL:", objectUrl);

        img.onload = () => {
          console.log("[QRScanner] DEBUG: Image loaded successfully:", {
            width: img.width,
            height: img.height,
          });

          // Use requestAnimationFrame to avoid blocking the UI
          requestAnimationFrame(() => {
            try {
              console.log(
                "[QRScanner] DEBUG: Resizing image for faster processing..."
              );

              // Resize image to max 1000px for faster processing
              const canvas = resizeImage(img, 1000);
              console.log("[QRScanner] DEBUG: Image resized to:", {
                width: canvas.width,
                height: canvas.height,
              });

              // Get image data from resized canvas
              const ctx = canvas.getContext("2d");
              const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
              );
              console.log("[QRScanner] DEBUG: Image data extracted:", {
                width: imageData.width,
                height: imageData.height,
                dataLength: imageData.data.length,
              });

              // Decode QR code from image
              console.log(
                "[QRScanner] DEBUG: Attempting to decode QR code with jsQR..."
              );
              let qrCode = jsQR(
                imageData.data,
                imageData.width,
                imageData.height
              );

              // If not found, try with a smaller size (sometimes helps with detection)
              if (!qrCode && (canvas.width > 500 || canvas.height > 500)) {
                console.log(
                  "[QRScanner] DEBUG: QR not found, trying smaller size..."
                );
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

              console.log("[QRScanner] DEBUG: jsQR result:", qrCode);

              // Dismiss loading message
              message.destroy("processing");

              // Clean up object URL after a short delay to allow preview
              setTimeout(() => {
                URL.revokeObjectURL(objectUrl);
                setImagePreview(null);
              }, 2000);

              if (qrCode) {
                // QR code found
                console.log("[QRScanner] DEBUG: QR code detected:", {
                  data: qrCode.data,
                  location: qrCode.location,
                });
                // Play custom scan sound
                playScanSound();
                if (onScan) {
                  console.log(
                    "[QRScanner] DEBUG: Calling onScan with QR data:",
                    qrCode.data
                  );
                  onScan(qrCode.data);
                  // Don't show notification here - SecurityView will show success card
                } else {
                  console.error(
                    "[QRScanner] DEBUG: onScan callback is not defined!"
                  );
                }
              } else {
                // No QR code found
                console.log("[QRScanner] DEBUG: No QR code detected in image");
                setError(
                  "No se pudo detectar un código QR en la imagen. Por favor, intenta con otra imagen o usa el modo manual."
                );
                message.warning("No se detectó código QR");
              }
              setProcessingImage(false);
            } catch (err) {
              console.error("[QRScanner] DEBUG: Error processing image:", err);
              URL.revokeObjectURL(objectUrl);
              message.destroy("processing");
              setError(
                "Error al procesar la imagen. Por favor, intenta nuevamente."
              );
              message.error("Error al procesar la imagen");
              setProcessingImage(false);
            }
          });
        };

        img.onerror = (error) => {
          console.error("[QRScanner] DEBUG: Image load error:", error);
          URL.revokeObjectURL(objectUrl);
          message.destroy("processing");
          setError(
            "Error al cargar la imagen. Por favor, intenta con otra imagen."
          );
          message.error("Error al procesar la imagen");
          setProcessingImage(false);
        };

        console.log("[QRScanner] DEBUG: Setting image source to object URL");
        img.src = objectUrl;
      } catch (err) {
        console.error("[QRScanner] DEBUG: Error processing image:", err);
        message.destroy("processing");
        setImagePreview(null);
        setError("Error al procesar la imagen. Por favor, intenta nuevamente.");
        message.error("Error al procesar la imagen");
        setProcessingImage(false);
      }

      // Reset file input after a delay to ensure processing is complete
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
          console.log("[QRScanner] DEBUG: File input reset");
        }
      }, 100);
    },
    [onScan, message]
  );

  const handleFileSelect = useCallback(
    async (event) => {
      console.log("[QRScanner] DEBUG: handleFileSelect called");
      console.log("[QRScanner] DEBUG: event:", event);
      console.log("[QRScanner] DEBUG: event.target:", event.target);
      console.log("[QRScanner] DEBUG: event.target.files:", event.target.files);
      console.log(
        "[QRScanner] DEBUG: fileInputRef.current?.files:",
        fileInputRef.current?.files
      );

      // Try both event.target and fileInputRef.current
      const files = event.target?.files || fileInputRef.current?.files;
      const file = files?.[0];

      if (!file) {
        console.log(
          "[QRScanner] DEBUG: No file selected - checking fileInputRef directly"
        );
        // Double check the ref directly
        if (fileInputRef.current?.files?.length > 0) {
          console.log(
            "[QRScanner] DEBUG: Found file in fileInputRef.current.files"
          );
          const refFile = fileInputRef.current.files[0];
          console.log("[QRScanner] DEBUG: File from ref:", {
            name: refFile.name,
            type: refFile.type,
            size: refFile.size,
          });
          // Process the file from ref
          await processFile(refFile);
        } else {
          console.log(
            "[QRScanner] DEBUG: No file found in either event.target or fileInputRef"
          );
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
      console.log("[QRScanner] DEBUG: fileInput ref not available yet");
      return;
    }

    console.log("[QRScanner] DEBUG: Attaching event listeners to file input");

    const handleInput = (e) => {
      console.log("[QRScanner] DEBUG: File input 'input' event triggered");
      console.log("[QRScanner] DEBUG: Files in input event:", e.target.files);
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelect(e);
      }
    };

    const handleChange = (e) => {
      console.log("[QRScanner] DEBUG: File input 'change' event triggered");
      console.log("[QRScanner] DEBUG: Files in change event:", e.target.files);
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelect(e);
      }
    };

    // Add both input and change listeners for maximum compatibility
    fileInput.addEventListener("input", handleInput);
    fileInput.addEventListener("change", handleChange);

    return () => {
      console.log(
        "[QRScanner] DEBUG: Removing event listeners from file input"
      );
      fileInput.removeEventListener("input", handleInput);
      fileInput.removeEventListener("change", handleChange);
    };
  }, [handleFileSelect]);

  const openCameraFallback = () => {
    console.log("[QRScanner] DEBUG: openCameraFallback called");
    console.log(
      "[QRScanner] DEBUG: fileInputRef.current:",
      fileInputRef.current
    );
    if (fileInputRef.current) {
      console.log("[QRScanner] DEBUG: Clicking file input to open camera...");
      fileInputRef.current.click();
      console.log("[QRScanner] DEBUG: File input clicked");
    } else {
      console.error("[QRScanner] DEBUG: fileInputRef.current is null!");
    }
  };

  // Debug render state
  console.log("[QRScanner] DEBUG: Render state:", {
    scanMode,
    cameraSupported,
    isScanning,
    processingImage,
    error,
    hasFileInputRef: !!fileInputRef.current,
  });

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

          {/* Image Preview */}
          {imagePreview && (
            <div className="w-full">
              <Card title="Imagen Capturada">
                <div className="w-full flex justify-center relative" style={{ minHeight: "200px", maxHeight: "256px" }}>
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-contain rounded-lg"
                    unoptimized
                  />
                </div>
              </Card>
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
                  onChange={(e) => {
                    console.log(
                      "[QRScanner] DEBUG: File input onChange (prop) triggered"
                    );
                    console.log(
                      "[QRScanner] DEBUG: onChange files:",
                      e.target.files
                    );
                    handleFileSelect(e);
                  }}
                  onInput={(e) => {
                    console.log(
                      "[QRScanner] DEBUG: File input onInput (prop) triggered"
                    );
                    console.log(
                      "[QRScanner] DEBUG: onInput files:",
                      e.target.files
                    );
                    handleFileSelect(e);
                  }}
                  onClick={(e) => {
                    console.log(
                      "[QRScanner] DEBUG: File input onClick triggered"
                    );
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
                  Abrir Cámara
                </Button>
              </div>
            </div>
          )}

          {/* Error Display - Only show if not using fallback */}
          {error && !(scanMode === "camera" && !cameraSupported) && (
            <Alert
              title="Error"
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
