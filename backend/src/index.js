const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../.env")
});

const connectDB = require("./config/db");
const routerApi = require("./routes");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const { errorHandler, notFound } = require("./middlewares/errorHandler");

const app = express();
const port = process.env.PORT || 4000;
const isVercel = Boolean(process.env.VERCEL);
const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  "http://localhost:4200",
  "http://127.0.0.1:4200",
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
].filter(Boolean));

app.use(cors({
  origin(origin, callback) {
    if (
      !origin
      || allowedOrigins.has(origin)
      || /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:4200$/.test(origin)
      || /^https:\/\/.*\.vercel\.app$/.test(origin)
    ) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());

let dbReady;

function ensureDatabase() {
  if (!dbReady) {
    dbReady = connectDB();
  }

  return dbReady;
}

app.use(async (req, res, next) => {
  try {
    if (req.path.startsWith("/api")) {
      await ensureDatabase();
    }
    next();
  } catch (error) {
    next(error);
  }
});

app.get("/", (req, res) => {
  res.json({
    name: "Reportes Urbanos API",
    status: "ok",
    endpoints: ["/api/auth", "/api/locations", "/api/zones", "/api/routes", "/api/reports", "/api/categories"],
    docs: "/api-docs"
  });
});

app.get("/api-docs.json", (req, res) => {
  res.json(swaggerSpec);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true
  }
}));

routerApi(app);

const frontendDist = path.join(__dirname, "../../frontend/dist/geo-apoyo-angular/browser");
app.use(express.static(frontendDist));

app.use(notFound);
app.use(errorHandler);

if (!isVercel) {
  ensureDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
  });
  });
}

module.exports = app;
