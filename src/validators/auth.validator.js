const { z } = require("zod");

const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Password debe tener minimo 6 caracteres"),
});

module.exports = {
  loginSchema,
};
