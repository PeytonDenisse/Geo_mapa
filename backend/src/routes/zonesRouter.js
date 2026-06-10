const express = require("express");
const ZoneService = require("../services/zoneService");
const asyncHandler = require("../middlewares/asyncHandler");

const router = express.Router();
const service = new ZoneService();

/**
 * @swagger
 * tags:
 *   - name: Zonas
 *     description: CRUD de colonias o zonas afectadas
 */

/**
 * @swagger
 * /api/zones:
 *   get:
 *     summary: Obtener todas las zonas
 *     tags: [Zonas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de zonas registradas
 */
router.get("/", asyncHandler(async (req, res) => {
  const zones = await service.getAll();
  res.json(zones);
}));

/**
 * @swagger
 * /api/zones:
 *   post:
 *     summary: Crear zona o colonia afectada
 *     tags: [Zonas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Zone'
 *           example:
 *             name: Colonia afectada
 *             description: Zona con problemas de baches
 *             category: 665000000000000000000001
 *             points:
 *               - lat: 21.1219
 *                 lng: -101.6826
 *               - lat: 21.1224
 *                 lng: -101.6819
 *               - lat: 21.1211
 *                 lng: -101.6813
 *     responses:
 *       201:
 *         description: Zona creada correctamente
 */
router.post("/", asyncHandler(async (req, res) => {
  const zone = await service.create(req.body, req.user._id);
  res.status(201).json(zone);
}));

/**
 * @swagger
 * /api/zones/{id}:
 *   patch:
 *     summary: Actualizar zona
 *     tags: [Zonas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la zona
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
 *             name: Zona actualizada
 *             description: Colonia con afectacion confirmada
 *             category: 665000000000000000000001
 *     responses:
 *       200:
 *         description: Zona actualizada correctamente
 */
router.patch("/:id", asyncHandler(async (req, res) => {
  const zone = await service.update(req.params.id, req.body);
  res.json(zone);
}));

/**
 * @swagger
 * /api/zones/{id}:
 *   delete:
 *     summary: Eliminar zona
 *     tags: [Zonas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la zona
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Zona eliminada correctamente
 */
router.delete("/:id", asyncHandler(async (req, res) => {
  const result = await service.delete(req.params.id);
  res.json(result);
}));

module.exports = router;
