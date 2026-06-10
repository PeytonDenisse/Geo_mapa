const express = require("express");

const authRouter = require("./authRouter");
const locationsRouter = require("./locationsRouter");
const zonesRouter = require("./zonesRouter");
const routesRouter = require("./routesRouter");
const reportsRouter = require("./reportsRouter");
const categoriesRouter = require("./categoriesRouter");
const { protect } = require("../middlewares/authMiddleware");

function routerApi(app) {
  const router = express.Router();

  app.use("/api", router);

  router.use("/auth", authRouter);
  router.use("/locations", protect, locationsRouter);
  router.use("/zones", protect, zonesRouter);
  router.use("/routes", protect, routesRouter);
  router.use("/reports", protect, reportsRouter);
  router.use("/categories", protect, categoriesRouter);
}

module.exports = routerApi;
