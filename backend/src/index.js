const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../.env")
});

const connectDB = require("./config/db");
const routerApi = require("./routes");
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
    const isApiRoute = req.path === "/api" || req.path.startsWith("/api/");
    const isSwaggerRoute = req.path === "/api-docs"
      || req.path.startsWith("/api-docs/")
      || req.path === "/api-docs.json"
      || req.path === "/api/api-docs"
      || req.path.startsWith("/api/api-docs/")
      || req.path === "/api/api-docs.json";

    if (isApiRoute && !isSwaggerRoute) {
      await ensureDatabase();
    }
    next();
  } catch (error) {
    next(error);
  }
});

function apiStatus(req, res) {
  res.json({
    name: "Reportes Urbanos API",
    status: "ok",
    endpoints: ["/api/auth", "/api/locations", "/api/zones", "/api/routes", "/api/reports", "/api/categories"],
    docs: "/api-docs"
  });
}

app.get("/api", apiStatus);

app.get(["/api-docs.json", "/api/api-docs.json"], (req, res) => {
  res.json(swaggerSpec);
});

function swaggerPage(req, res) {
  const specUrl = req.path.startsWith("/api/api-docs") ? "/api/api-docs.json" : "/api-docs.json";

  res.type("html").send(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reportes Urbanos API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
    <style>
      body { margin: 0; background: #ffffff; }
      .swagger-ui .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: "${specUrl}",
          dom_id: "#swagger-ui",
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          layout: "StandaloneLayout",
          persistAuthorization: true
        });
      };
    </script>
  </body>
</html>`);
}

app.get(["/api-docs", "/api-docs/", "/api/api-docs", "/api/api-docs/"], swaggerPage);

routerApi(app);

const frontendDist = path.join(__dirname, "../../frontend/dist/geo-apoyo-angular/browser");
app.use(express.static(frontendDist));

app.get(/^\/(?!api(?:\/|$)|api-docs(?:\/|$)).*/, (req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

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
