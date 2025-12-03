import { supabase } from "./supabase";
import * as fs from "fs";

const BUCKET_NAME = "clips";

// Upload file to Supabase Storage
export async function uploadFile(
  localPath: string,
  storagePath: string
): Promise<string> {
  console.log(`Uploading ${storagePath}...`);

  const fileBuffer = fs.readFileSync(localPath);
  const contentType = storagePath.endsWith(".mp4") ? "video/mp4" : "image/jpeg";

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);

  console.log(`Uploaded: ${data.publicUrl}`);
  return data.publicUrl;
}

// Delete file from storage
export async function deleteFile(storagePath: string): Promise<void> {
  await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
}
