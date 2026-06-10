const express = require("express");
const ReportService = require("../services/reportService");
const asyncHandler = require("../middlewares/asyncHandler");

const router = express.Router();
const service = new ReportService();

/**
 * @swagger
 * tags:
 *   - name: Reportes
 *     description: CRUD de reportes urbanos vinculados a punto, zona o ruta
 */

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Obtener todos los reportes
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de reportes con categoria y destino poblado
 */
router.get("/", asyncHandler(async (req, res) => {
  const reports = await service.getAll();
  res.json(reports);
}));

/**
 * @swagger
 * /api/reports/nearby:
 *   get:
 *     summary: Obtener reportes cercanos a una coordenada
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         example: 21.1219
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         example: -101.6826
 *       - in: query
 *         name: radiusKm
 *         required: false
 *         schema:
 *           type: number
 *         example: 2
 *     responses:
 *       200:
 *         description: Reportes cercanos ordenados por distancia
 */
router.get("/nearby", asyncHandler(async (req, res) => {
  const reports = await service.getNearby(req.query.lat, req.query.lng, req.query.radiusKm);
  res.json(reports);
}));

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Crear reporte urbano para punto, zona o ruta
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     description: targetType puede ser location, zone o route. targetId debe ser el ID del elemento seleccionado.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Report'
 *           examples:
 *             reportePunto:
 *               summary: Reporte para punto
 *               value:
 *                 title: Bache profundo
 *                 description: Bache en carril derecho
 *                 priority: media
 *                 status: pendiente
 *                 category: 665000000000000000000001
 *                 targetType: location
 *                 targetId: 665000000000000000000010
 *             reporteZona:
 *               summary: Reporte para zona
 *               value:
 *                 title: Colonia afectada
 *                 description: Varias calles con basura acumulada
 *                 priority: alta
 *                 status: en_proceso
 *                 category: 665000000000000000000002
 *                 targetType: zone
 *                 targetId: 665000000000000000000020
 *             reporteRuta:
 *               summary: Reporte para ruta
 *               value:
 *                 title: Ruta en construccion
 *                 description: Calle cerrada por reparacion
 *                 priority: alta
 *                 status: en_proceso
 *                 category: 665000000000000000000003
 *                 targetType: route
 *                 targetId: 665000000000000000000030
 *     responses:
 *       201:
 *         description: Reporte creado correctamente
 *       400:
 *         description: Datos invalidos
 */
router.post("/", asyncHandler(async (req, res) => {
  const report = await service.create(req.body, req.user._id);
  res.status(201).json(report);
}));

/**
 * @swagger
 * /api/reports/{id}:
 *   patch:
 *     summary: Actualizar reporte
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del reporte
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [baja, media, alta]
 *               status:
 *                 type: string
 *                 enum: [pendiente, en_proceso, resuelto]
 *               category:
 *                 type: string
 *               targetType:
 *                 type: string
 *                 enum: [location, zone, route]
 *               targetId:
 *                 type: string
 *           example:
 *             title: Reporte actualizado
 *             description: Se actualizo el estado del problema
 *             priority: alta
 *             status: resuelto
 *             category: 665000000000000000000001
 *             targetType: route
 *             targetId: 665000000000000000000030
 *     responses:
 *       200:
 *         description: Reporte actualizado correctamente
 */
router.patch("/:id", asyncHandler(async (req, res) => {
  const report = await service.update(req.params.id, req.body);
  res.json(report);
}));

/**
 * @swagger
 * /api/reports/{id}:
 *   delete:
 *     summary: Eliminar reporte
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del reporte
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reporte eliminado correctamente
 */
router.delete("/:id", asyncHandler(async (req, res) => {
  const result = await service.delete(req.params.id);
  res.json(result);
}));

module.exports = router;
