require("dotenv").config();

function hostSummary(raw) {
  if (!raw || String(raw).trim() === "") return { label: "(vacío)", ok: false };
  try {
    const u = new URL(String(raw).trim());
    const host = u.hostname || "";
    const port = u.port || (u.protocol === "postgresql:" || u.protocol === "postgres:" ? "5432" : "");
    const isPoolerHost = host.includes("pooler.supabase.com");
    return {
      label: `${host}:${port || "default"}`,
      ok: true,
      isSupabasePooler6543: isPoolerHost && (u.port === "6543" || raw.includes(":6543")),
      isSupabasePooler5432: isPoolerHost && (u.port === "5432" || raw.includes(":5432")),
      isSupabaseDb5432:
        host.startsWith("db.") &&
        host.endsWith(".supabase.co") &&
        (u.port === "5432" || !u.port || raw.includes(":5432")),
    };
  } catch {
    return { label: "(URL inválida)", ok: false };
  }
}

const db = process.env.DATABASE_URL?.trim();
const direct = process.env.DIRECT_URL?.trim();
const ssl = process.env.DATABASE_SSL;

let exit = 0;
console.log("Verificación .env (sin contraseñas)\n");

const sDb = hostSummary(db);
if (!db) {
  console.log("✗ DATABASE_URL: falta.");
  exit = 1;
} else {
  console.log(`· DATABASE_URL → ${sDb.label}`);
  if (sDb.isSupabasePooler6543) console.log("  (Transaction pooler: correcto para la API en Supabase.)");
}

const sDir = hostSummary(direct);
if (!direct) {
  console.log("✗ DIRECT_URL: falta. Con Supabase + pooler en DATABASE_URL, hace falta la URI Direct (5432).");
  exit = 1;
} else {
  console.log(`· DIRECT_URL → ${sDir.label}`);
  if (sDir.isSupabasePooler6543) {
    console.log("✗ DIRECT_URL no debe ser el pooler :6543. Usa Direct connection (host db.*.supabase.co).");
    exit = 1;
  } else if (sDir.isSupabasePooler5432) {
    console.log(
      "· DIRECT_URL: session pooler (pooler…:5432). Válido si `db.*` te da P1001 (IPv4); ideal para migrate en Windows."
    );
  } else if (sDir.isSupabaseDb5432) {
    console.log("  (Conexión directa Supabase: ideal para prisma migrate.)");
  }
}

if (ssl === "1") console.log("· DATABASE_SSL=1 (TLS activo para la app)");
else if (ssl === "0" || ssl === undefined) console.log("· DATABASE_SSL: no es 1 (en Supabase remoto suele hacer falta DATABASE_SSL=1)");

if (!process.env.JWT_SECRET?.trim()) {
  console.log("✗ JWT_SECRET: falta o vacío.");
  exit = 1;
} else console.log("· JWT_SECRET: definido");

const supaKey = process.env.SUPABASE_SERVICE_KEY?.trim() ?? "";
if (!process.env.SUPABASE_URL?.trim()) {
  console.log("· SUPABASE_URL: (vacío) — fotos desactivadas");
} else if (!supaKey) {
  console.log("✗ SUPABASE_SERVICE_KEY: falta — no se pueden subir fotos.");
  exit = 1;
} else if (supaKey.startsWith("sb_") && !supaKey.startsWith("eyJ")) {
  console.log("✗ SUPABASE_SERVICE_KEY: usa service_role (JWT eyJ…), no sb_secret.");
  exit = 1;
} else {
  console.log("· SUPABASE_SERVICE_KEY: formato OK (JWT)");
}

console.log("");
process.exit(exit);
