import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

const BUCKET = 'service-photos';

function getClient() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_URL y SUPABASE_SERVICE_KEY requeridos para subir fotos');
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
}

export async function uploadServicePhoto(
  workshopId: string,
  serviceId: string,
  buffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<string> {
  const supabase = getClient();
  const ext = filename.split('.').pop() ?? 'jpg';
  const path = `${workshopId}/${serviceId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) throw new Error(`Storage error: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteServicePhoto(publicUrl: string): Promise<void> {
  const supabase = getClient();
  const url = new URL(publicUrl);
  const path = url.pathname.split(`/storage/v1/object/public/${BUCKET}/`)[1];
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
