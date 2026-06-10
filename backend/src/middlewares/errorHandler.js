function notFound(req, res, next) {
  const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

function errorHandler(error, req, res, next) {
  const status = error.status || 500;

  res.status(status).json({
    message: error.message || "Error interno del servidor",
    details: process.env.NODE_ENV === "production" ? undefined : error.details
  });
}

module.exports = {
  notFound,
  errorHandler
};
