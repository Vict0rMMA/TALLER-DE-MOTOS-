import "dotenv/config";
import { defineConfig } from "prisma/config";

function looksLikeSupabaseTransactionPooler(url: string): boolean {
  return url.includes("pooler.supabase.com") && url.includes(":6543");
}

function enforcesDirectPostgresForCli(): boolean {
  const argv = process.argv.join(" ");
  return (
    /\bmigrate\b/.test(argv) ||
    /\bdb\s+push\b/.test(argv) ||
    /\bdb\s+pull\b/.test(argv) ||
    /\bdb\s+execute\b/.test(argv)
  );
}

function migrationDatabaseUrl(): string {
  const enforce = enforcesDirectPostgresForCli();
  const direct = process.env.DIRECT_URL?.trim();
  if (direct) {
    if (enforce && looksLikeSupabaseTransactionPooler(direct)) {
      throw new Error(
        "DIRECT_URL apunta al pooler de Supabase (puerto 6543). " +
          "Usa la URI Direct connection del dashboard (host db.<proyecto>.supabase.co, puerto 5432)."
      );
    }
    return direct;
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error(
      "Falta DIRECT_URL o DATABASE_URL en .env para las migraciones de Prisma."
    );
  }

  if (enforce && looksLikeSupabaseTransactionPooler(databaseUrl)) {
    throw new Error(
      [
        'Prisma Migrate no puede usar el Transaction pooler de Supabase (prepared statements → error "s1" already exists).',
        "Define DIRECT_URL con la cadena Direct (5432) desde Supabase → Project Settings → Database.",
        "Mantén DATABASE_URL con el pooler (6543) solo para la API en tiempo de ejecución.",
      ].join("\n")
    );
  }

  return databaseUrl;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrationDatabaseUrl(),
  },
});
