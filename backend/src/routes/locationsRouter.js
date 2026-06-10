const express = require("express");
const LocationService = require("../services/locationService");
const asyncHandler = require("../middlewares/asyncHandler");

const router = express.Router();
const service = new LocationService();

/**
 * @swagger
 * tags:
 *   - name: Puntos
 *     description: CRUD de ubicaciones exactas de problemas urbanos
 */

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: Obtener todos los puntos
 *     tags: [Puntos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de puntos registrados
 *       401:
 *         description: No autorizado
 */
router.get("/", asyncHandler(async (req, res) => {
  const locations = await service.getAll();
  res.json(locations);
}));

/**
 * @swagger
 * /api/locations/search:
 *   get:
 *     summary: Buscar puntos por nombre
 *     tags: [Puntos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         example: Parque
 *     responses:
 *       200:
 *         description: Resultados de busqueda
 */
router.get("/search", asyncHandler(async (req, res) => {
  const locations = await service.searchByName(req.query.name);
  res.json(locations);
}));

/**
 * @swagger
 * /api/locations/{id}:
 *   get:
 *     summary: Obtener un punto por ID
 *     tags: [Puntos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del punto
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Punto encontrado
 *       404:
 *         description: Punto no encontrado
 */
router.get("/:id", asyncHandler(async (req, res) => {
  const location = await service.getById(req.params.id);
  res.json(location);
}));

/**
 * @swagger
 * /api/locations:
 *   post:
 *     summary: Crear punto / ubicacion exacta
 *     tags: [Puntos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Location'
 *           example:
 *             name: Bache frente al parque
 *             description: Bache profundo en carril derecho
 *             latitude: 21.1219
 *             longitude: -101.6826
 *             category: 665000000000000000000001
 *     responses:
 *       201:
 *         description: Punto creado correctamente
 *       400:
 *         description: Datos invalidos
 */
router.post("/", asyncHandler(async (req, res) => {
  const location = await service.create(req.body, req.user._id);
  res.status(201).json(location);
}));

/**
 * @swagger
 * /api/locations/{id}:
 *   patch:
 *     summary: Actualizar punto
 *     tags: [Puntos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del punto
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
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               category:
 *                 type: string
 *           example:
 *             name: Parque Metropolitano
 *             description: Reporte actualizado
 *             category: 665000000000000000000001
 *     responses:
 *       200:
 *         description: Punto actualizado correctamente
 */
router.patch("/:id", asyncHandler(async (req, res) => {
  const location = await service.update(req.params.id, req.body);
  res.json(location);
}));

/**
 * @swagger
 * /api/locations/{id}:
 *   delete:
 *     summary: Eliminar punto
 *     tags: [Puntos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del punto
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Punto eliminado correctamente
 */
router.delete("/:id", asyncHandler(async (req, res) => {
  const result = await service.delete(req.params.id);
  res.json(result);
}));

module.exports = router;
