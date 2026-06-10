const express = require("express");
const RouteService = require("../services/routeService");
const asyncHandler = require("../middlewares/asyncHandler");

const router = express.Router();
const service = new RouteService();

/**
 * @swagger
 * tags:
 *   - name: Rutas
 *     description: CRUD de rutas o calles afectadas
 */

/**
 * @swagger
 * /api/routes:
 *   get:
 *     summary: Obtener todas las rutas
 *     tags: [Rutas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de rutas registradas
 */
router.get("/", asyncHandler(async (req, res) => {
  const routes = await service.getAll();
  res.json(routes);
}));

/**
 * @swagger
 * /api/routes:
 *   post:
 *     summary: Crear ruta o calle afectada
 *     tags: [Rutas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Route'
 *           example:
 *             name: Calle en construccion
 *             description: Tramo cerrado por obra
 *             category: 665000000000000000000001
 *             points:
 *               - lat: 21.1219
 *                 lng: -101.6826
 *               - lat: 21.1240
 *                 lng: -101.6800
 *     responses:
 *       201:
 *         description: Ruta creada correctamente
 */
router.post("/", asyncHandler(async (req, res) => {
  const route = await service.create(req.body, req.user._id);
  res.status(201).json(route);
}));

/**
 * @swagger
 * /api/routes/{id}:
 *   patch:
 *     summary: Actualizar ruta
 *     tags: [Rutas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la ruta
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               points:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Point'
 *           example:
 *             name: Calle cerrada
 *             description: Ruta en construccion
 *             category: 665000000000000000000001
 *     responses:
 *       200:
 *         description: Ruta actualizada correctamente
 */
router.patch("/:id", asyncHandler(async (req, res) => {
  const route = await service.update(req.params.id, req.body);
  res.json(route);
}));

/**
 * @swagger
 * /api/routes/{id}:
 *   delete:
 *     summary: Eliminar ruta
 *     tags: [Rutas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la ruta
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ruta eliminada correctamente
 */
router.delete("/:id", asyncHandler(async (req, res) => {
  const result = await service.delete(req.params.id);
  res.json(result);
}));

module.exports = router;
