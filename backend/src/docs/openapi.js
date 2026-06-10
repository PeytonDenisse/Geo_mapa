const openApiDocument = {
  openapi: "3.0.0",
  info: {
    title: "Reportes Urbanos API",
    version: "1.0.0",
    description: "API para CRUD georeferenciado de puntos, zonas, rutas, reportes y categorias."
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Servidor local"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      AuthRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "denisse@gmail.com" },
          password: { type: "string", example: "123456" }
        }
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Denisse" },
          email: { type: "string", example: "denisse@gmail.com" },
          password: { type: "string", example: "123456" }
        }
      },
      Category: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string", example: "Bache" },
          description: { type: "string" },
          color: { type: "string", example: "#f97316" },
          active: { type: "boolean", example: true }
        }
      },
      Location: {
        type: "object",
        required: ["name", "description", "latitude", "longitude"],
        properties: {
          _id: { type: "string" },
          name: { type: "string", example: "Bache en avenida" },
          description: { type: "string", example: "Bache profundo frente al parque" },
          latitude: { type: "number", example: 21.1219 },
          longitude: { type: "number", example: -101.6826 },
          category: { type: "string", description: "Id de categoria opcional" }
        }
      },
      Point: {
        type: "object",
        required: ["lat", "lng"],
        properties: {
          lat: { type: "number", example: 21.1219 },
          lng: { type: "number", example: -101.6826 }
        }
      },
      Zone: {
        type: "object",
        required: ["name", "points"],
        properties: {
          _id: { type: "string" },
          name: { type: "string", example: "Colonia afectada" },
          description: { type: "string", example: "Zona con varios reportes de baches" },
          category: { type: "string", description: "Id de categoria opcional" },
          points: {
            type: "array",
            items: { $ref: "#/components/schemas/Point" }
          }
        }
      },
      Route: {
        type: "object",
        required: ["name", "points"],
        properties: {
          _id: { type: "string" },
          name: { type: "string", example: "Calle en construccion" },
          description: { type: "string", example: "Tramo cerrado por obra" },
          category: { type: "string", description: "Id de categoria opcional" },
          points: {
            type: "array",
            items: { $ref: "#/components/schemas/Point" }
          }
        }
      },
      Report: {
        type: "object",
        required: ["title", "description", "category", "targetType", "targetId"],
        properties: {
          _id: { type: "string" },
          title: { type: "string", example: "Reporte de calle cerrada" },
          description: { type: "string", example: "La ruta esta en construccion" },
          priority: { type: "string", enum: ["baja", "media", "alta"], example: "media" },
          status: { type: "string", enum: ["pendiente", "en_proceso", "resuelto"], example: "en_proceso" },
          category: { type: "string", description: "Id de categoria" },
          targetType: { type: "string", enum: ["location", "zone", "route"], example: "route" },
          targetId: { type: "string", description: "Id del punto, zona o ruta" }
        }
      }
    }
  },
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Registrar usuario",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } }
        },
        responses: { 201: { description: "Sesion creada" } }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Iniciar sesion",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AuthRequest" } } }
        },
        responses: { 200: { description: "Sesion con token JWT" } }
      }
    },
    "/api/locations": {
      get: { tags: ["Puntos"], summary: "Listar puntos", security: [{ bearerAuth: [] }], responses: { 200: { description: "Lista de puntos" } } },
      post: {
        tags: ["Puntos"],
        summary: "Crear punto",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Location" } } } },
        responses: { 201: { description: "Punto creado" } }
      }
    },
    "/api/locations/{id}": {
      patch: { tags: ["Puntos"], summary: "Editar punto", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Location" } } } }, responses: { 200: { description: "Punto actualizado" } } },
      delete: { tags: ["Puntos"], summary: "Eliminar punto", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Punto eliminado" } } }
    },
    "/api/zones": {
      get: { tags: ["Zonas"], summary: "Listar zonas", security: [{ bearerAuth: [] }], responses: { 200: { description: "Lista de zonas" } } },
      post: { tags: ["Zonas"], summary: "Crear zona", security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Zone" } } } }, responses: { 201: { description: "Zona creada" } } }
    },
    "/api/zones/{id}": {
      patch: { tags: ["Zonas"], summary: "Editar zona", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Zone" } } } }, responses: { 200: { description: "Zona actualizada" } } },
      delete: { tags: ["Zonas"], summary: "Eliminar zona", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Zona eliminada" } } }
    },
    "/api/routes": {
      get: { tags: ["Rutas"], summary: "Listar rutas", security: [{ bearerAuth: [] }], responses: { 200: { description: "Lista de rutas" } } },
      post: { tags: ["Rutas"], summary: "Crear ruta", security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Route" } } } }, responses: { 201: { description: "Ruta creada" } } }
    },
    "/api/routes/{id}": {
      patch: { tags: ["Rutas"], summary: "Editar ruta", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Route" } } } }, responses: { 200: { description: "Ruta actualizada" } } },
      delete: { tags: ["Rutas"], summary: "Eliminar ruta", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Ruta eliminada" } } }
    },
    "/api/reports": {
      get: { tags: ["Reportes"], summary: "Listar reportes", security: [{ bearerAuth: [] }], responses: { 200: { description: "Lista de reportes" } } },
      post: { tags: ["Reportes"], summary: "Crear reporte para punto, zona o ruta", security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Report" } } } }, responses: { 201: { description: "Reporte creado" } } }
    },
    "/api/reports/{id}": {
      patch: { tags: ["Reportes"], summary: "Editar reporte", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Report" } } } }, responses: { 200: { description: "Reporte actualizado" } } },
      delete: { tags: ["Reportes"], summary: "Eliminar reporte", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Reporte eliminado" } } }
    },
    "/api/categories": {
      get: { tags: ["Categorias"], summary: "Listar categorias", security: [{ bearerAuth: [] }], responses: { 200: { description: "Lista de categorias" } } },
      post: { tags: ["Categorias"], summary: "Crear categoria", security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Category" } } } }, responses: { 201: { description: "Categoria creada" } } }
    },
    "/api/categories/{id}": {
      patch: { tags: ["Categorias"], summary: "Editar categoria", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Category" } } } }, responses: { 200: { description: "Categoria actualizada" } } },
      delete: { tags: ["Categorias"], summary: "Eliminar categoria", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Categoria eliminada" } } }
    }
  }
};

module.exports = openApiDocument;
