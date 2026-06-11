const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");
const openApiDocument = require("./docs/openapi");

const options = {
  definition: openApiDocument,
  apis: [path.join(__dirname, "routes/*.js")]
};

module.exports = swaggerJsdoc(options);
