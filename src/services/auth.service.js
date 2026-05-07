const jwt = require("jsonwebtoken");

function login({ email, password }) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret || String(jwtSecret).trim() === "") {
    const err = new Error("JWT_SECRET no esta configurado en el servidor");
    err.statusCode = 500;
    throw err;
  }

  if (email !== adminEmail || password !== adminPassword) {
    const error = new Error("Credenciales invalidas");
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    {
      sub: email,
      role: "admin",
    },
    jwtSecret,
    { expiresIn: "1h" }
  );

  return {
    token,
    tokenType: "Bearer",
    expiresIn: "1h",
  };
}

module.exports = {
  login,
};
