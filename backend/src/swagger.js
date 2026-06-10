const swaggerJsdoc = require("swagger-jsdoc");
const openApiDocument = require("./docs/openapi");

const options = {
  definition: openApiDocument,
  apis: ["./src/routes/*.js"]
};

module.exports = swaggerJsdoc(options);
