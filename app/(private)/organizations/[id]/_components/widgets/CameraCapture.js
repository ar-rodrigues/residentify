"use client";

import { useState, useRef, useEffect } from "react";
import { Space, Typography, Alert } from "antd";
import {
  RiCameraLine,
  RiCameraSwitchLine,
  RiRefreshLine,
  RiCheckLine,
  RiCloseLine,
} from "react-icons/ri";
import Button from "@/components/ui/Button";

const { Text } = Typography;

export default function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState("environment"); // 'user' for front, 'environment' for back
  const [capturedImage, setCapturedImage] = useState(null);

  // Check if camera API is available
  const isCameraAvailable = () => {
    return (
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      typeof navigator.mediaDevices.getUserMedia === "function"
    );
  };

  // Check if we're in a secure context (HTTPS or localhost)
  const isSecureContext = () => {
    return (
      window.isSecureContext ||
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );
  };

  const startCamera = async (facing = facingMode) => {
    if (!isCameraAvailable()) {
      setError(
        "La cámara no está disponible en este navegador. Por favor, usa un navegador moderno."
      );
      return;
    }

    if (!isSecureContext()) {
      setError(
        "Se requiere una conexión segura (HTTPS) para acceder a la cámara."
      );
      return;
    }

    try {
      setError(null);

      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Request camera access
      const constraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        
        // Wait for video metadata to be loaded before playing
        const handleLoadedMetadata = () => {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsStreaming(true);
                video.removeEventListener("loadedmetadata", handleLoadedMetadata);
              })
              .catch((error) => {
                console.error("Error playing video:", error);
                // If play fails, still set streaming to true if srcObject is set
                if (video && video.srcObject) {
                  setIsStreaming(true);
                }
                video.removeEventListener("loadedmetadata", handleLoadedMetadata);
              });
          } else {
            setIsStreaming(true);
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
          }
        };

        // If video is already ready, play immediately
        if (video.readyState >= 2) {
          handleLoadedMetadata();
        } else {
          video.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true });
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      let errorMessage = "Error al acceder a la cámara.";

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage =
          "Se denegó el permiso para acceder a la cámara. Por favor, permite el acceso a la cámara en la configuración del navegador.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage = "No se encontró ninguna cámara en este dispositivo.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorMessage =
          "La cámara está siendo utilizada por otra aplicación. Por favor, cierra otras aplicaciones que puedan estar usando la cámara.";
      } else if (err.name === "OverconstrainedError") {
        errorMessage =
          "La cámara no cumple con los requisitos. Intentando con configuración alternativa...";
        // Try with default constraints
        try {
          const defaultStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          streamRef.current = defaultStream;
          if (videoRef.current) {
            const video = videoRef.current;
            video.srcObject = defaultStream;
            
            // Wait for video metadata to be loaded before playing
            const handleLoadedMetadata = () => {
              const playPromise = video.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    setIsStreaming(true);
                    video.removeEventListener("loadedmetadata", handleLoadedMetadata);
                  })
                  .catch((error) => {
                    console.error("Error playing video:", error);
                    // If play fails, still set streaming to true if srcObject is set
                    if (video && video.srcObject) {
                      setIsStreaming(true);
                    }
                    video.removeEventListener("loadedmetadata", handleLoadedMetadata);
                  });
              } else {
                setIsStreaming(true);
                video.removeEventListener("loadedmetadata", handleLoadedMetadata);
              }
            };

            // If video is already ready, play immediately
            if (video.readyState >= 2) {
              handleLoadedMetadata();
            } else {
              video.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true });
            }
            return;
          }
        } catch (fallbackErr) {
          errorMessage = "No se pudo acceder a la cámara con ninguna configuración.";
        }
      }

      setError(errorMessage);
      setIsStreaming(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);
    await startCamera(newFacingMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          // Create a File object from the blob
          const file = new File([blob], `photo-${Date.now()}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          // Create preview URL
          const previewUrl = URL.createObjectURL(blob);
          setCapturedImage({ file, preview: previewUrl });

          // Stop camera after capture
          stopCamera();
        }
      },
      "image/jpeg",
      0.9
    );
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (capturedImage && onCapture) {
      onCapture(capturedImage.file);
    }
  };

  const handleCancel = () => {
    stopCamera();
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage.preview);
      setCapturedImage(null);
    }
    // Call onCancel to close modal
    if (onCancel) {
      onCancel();
    }
  };

  // Auto-start camera when component mounts
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage.preview);
      }
    };
  }, []);

  // If we have a captured image, show preview with confirm/retake options
  if (capturedImage) {
    return (
      <div className="w-full h-full flex flex-col" style={{ height: "100%" }}>
        <div 
          className="relative w-full bg-black flex-1 flex items-center justify-center overflow-hidden"
          style={{ minHeight: 0 }}
        >
          <img
            src={capturedImage.preview}
            alt="Foto capturada"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="p-4 bg-white border-t border-gray-200">
          <Space size="middle" className="w-full justify-center">
            <Button icon={<RiRefreshLine />} onClick={retakePhoto}>
              Volver a tomar
            </Button>
            <Button
              type="primary"
              icon={<RiCheckLine />}
              onClick={confirmPhoto}
            >
              Confirmar foto
            </Button>
          </Space>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full" style={{ height: "100%" }}>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}

      {/* Video container - always show when modal is open */}
      <div className="relative w-full bg-black" style={{ height: "100%", width: "100%" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-contain"
          style={{ width: "100%", height: "100%" }}
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Loading state overlay */}
        {!isStreaming && !error && streamRef.current && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
            <div className="text-center text-white">
              <RiCameraLine className="text-4xl mb-2 mx-auto animate-pulse" />
              <Text className="text-white">Iniciando cámara...</Text>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !streamRef.current && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
            <div className="text-center text-white px-4">
              <Text className="text-white">{error}</Text>
            </div>
          </div>
        )}

        {/* Camera controls overlay - only show when streaming */}
        {isStreaming && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-8 z-10">
            <div className="flex items-center justify-center gap-6">
              {/* Switch camera button - left */}
              <Button
                icon={<RiCameraSwitchLine className="text-2xl" />}
                onClick={switchCamera}
                title="Cambiar cámara"
                className="bg-white/20 hover:bg-white/30 border-white/30 text-white w-16 h-16"
                size="large"
                shape="circle"
              />
              
              {/* Capture button - center, prominent and larger */}
              <Button
                type="primary"
                icon={<RiCameraLine className="text-4xl" />}
                onClick={capturePhoto}
                size="large"
                shape="circle"
                className="w-28 h-28 shadow-2xl border-4 border-white/30"
                style={{ minWidth: "7rem", minHeight: "7rem" }}
              />
              
              {/* Cancel button - right */}
              <Button
                icon={<RiCloseLine className="text-2xl" />}
                onClick={handleCancel}
                className="bg-white/20 hover:bg-white/30 border-white/30 text-white w-16 h-16"
                size="large"
                shape="circle"
                title="Cancelar"
              />
            </div>
          </div>
        )}

        {/* Start button - shown when camera is not started */}
        {!isStreaming && !error && !streamRef.current && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
            <Button
              type="primary"
              icon={<RiCameraLine className="text-4xl" />}
              onClick={() => startCamera()}
              size="large"
              className="w-32 h-32 mb-4"
              shape="circle"
            />
            <Button onClick={handleCancel} className="mt-4">
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

