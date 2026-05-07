function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: "Ruta no encontrada",
  });
}

function errorHandler(err, req, res, next) {
  if (err.name === "ZodError") {
    return res.status(400).json({
      error: "Error de validacion",
      details: err.issues,
    });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({
      error: "No se pudo procesar el archivo adjunto",
    });
  }

  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    console.error("[api]", err.message);
    if (process.env.NODE_ENV !== "production" && err.stack) {
      console.error(err.stack);
    }
    return res.status(500).json({
      error:
        "Tuvimos un problema al procesar la solicitud. Comprueba la base de datos y la configuracion, o intenta de nuevo mas tarde.",
    });
  }

  return res.status(statusCode).json({
    error: err.message || "Solicitud no valida",
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
