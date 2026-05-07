require("dotenv").config();

const app = require("./app");
const prisma = require("./db/prisma");

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    await prisma.$connect();
    app.listen(PORT, () => {
      console.log(`Servidor activo en http://localhost:${PORT}`);
      console.log(`Salud: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (error) {
    console.error("No fue posible iniciar el servidor:", error);
    process.exit(1);
  }
}

bootstrap();
