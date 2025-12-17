"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

/**
 * Custom hook for Supabase storage upload operations
 * @param {Object} options - Upload configuration
 * @param {string} options.bucket - Storage bucket name
 * @param {string} [options.folder] - Folder path within the bucket
 * @param {boolean} [options.public] - Whether the file should be public (default: false)
 * @returns {{
 *   upload: (file: File) => Promise<{error: boolean, message: string, data?: string}>,
 *   loading: boolean,
 *   error: Error | null
 * }}
 */
export function useStorageUpload({
  bucket,
  folder = "",
  public: isPublic = false,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const upload = useCallback(
    async (file) => {
      try {
        setLoading(true);
        setError(null);

        if (!file) {
          throw new Error("Archivo es requerido.");
        }

        if (!bucket || typeof bucket !== "string") {
          throw new Error("Bucket es requerido.");
        }

        const supabase = createClient();

        // Generate unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 15)}.${fileExt}`;
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        // Upload file to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message || "Error al subir el archivo.");
        }

        // Get public URL or signed URL
        let fileUrl;
        if (isPublic) {
          const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);
          fileUrl = publicUrlData.publicUrl;
        } else {
          // Generate signed URL for private files (valid for 1 year)
          const { data: signedUrlData, error: signedUrlError } =
            await supabase.storage
              .from(bucket)
              .createSignedUrl(filePath, 31536000); // 1 year in seconds

          if (signedUrlError) {
            throw new Error(
              signedUrlError.message || "Error al generar la URL del archivo."
            );
          }

          fileUrl = signedUrlData.signedUrl;
        }

        return {
          error: false,
          message: "Archivo subido exitosamente.",
          data: fileUrl,
        };
      } catch (err) {
        const errorMessage =
          err.message || "Error inesperado al subir el archivo.";
        setError(err);
        return {
          error: true,
          message: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [bucket, folder, isPublic]
  );

  return {
    upload,
    loading,
    error,
  };
}

















