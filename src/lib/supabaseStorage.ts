// src/lib/supabaseStorage.ts
//URL BASE PÚBLICA DE TU BUCKET
export const PUBLIC_BUCKET_URL =
  "https://eugknpryvakohiekwigd.supabase.co/storage/v1/s3";

/** 
 * Genera la URL pública completa para un archivo del bucket 
 * @param path Ruta guardada en la BD (ejemplo: "frenteId/archivo.jpg")
 */
export const getPublicUrl = (path: string): string => {
  if (!path) return "";
  return `${PUBLIC_BUCKET_URL}/${path}`;
};
