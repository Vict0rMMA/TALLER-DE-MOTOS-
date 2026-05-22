/**
 * Crea el bucket público service-photos en Supabase.
 * Uso: node scripts/setup-supabase-storage.mjs
 * Requiere SUPABASE_URL y SUPABASE_SERVICE_KEY en .env
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const url = process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_KEY?.trim();
const BUCKET = 'service-photos';

if (!url || !key) {
  console.error('Falta SUPABASE_URL o SUPABASE_SERVICE_KEY en .env');
  process.exit(1);
}

const supabase = createClient(url, key);

const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
if (listErr) {
  console.error('No se pudo listar buckets:', listErr.message);
  console.error('Revisa que la clave sea la "service_role" (Settings → API → service_role).');
  process.exit(1);
}

const exists = buckets?.some((b) => b.name === BUCKET);
if (exists) {
  console.log(`✓ El bucket "${BUCKET}" ya existe.`);
} else {
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 8 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'],
  });
  if (error) {
    console.error('Error al crear bucket:', error.message);
    process.exit(1);
  }
  console.log(`✓ Bucket "${BUCKET}" creado (público).`);
}

console.log('\nListo. Reinicia la API en el VPS (pm2 restart motobrain-api).');
