const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const useSsl = process.env.DATABASE_SSL === "1";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
