const express = require("express");
const CategoryService = require("../services/categoryService");
const asyncHandler = require("../middlewares/asyncHandler");

const router = express.Router();
const service = new CategoryService();

/**
 * @swagger
 * tags:
 *   - name: Categorias
 *     description: CRUD de categorias de incidentes urbanos
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Obtener todas las categorias
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorias
 */
router.get("/", asyncHandler(async (req, res) => {
  const categories = await service.getAll();
  res.json(categories);
}));

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Crear categoria
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *           example:
 *             name: Construccion
 *             description: Obras o calles cerradas por reparacion
 *             color: "#ef4444"
 *             active: true
 *     responses:
 *       201:
 *         description: Categoria creada correctamente
 */
router.post("/", asyncHandler(async (req, res) => {
  const category = await service.create(req.body, req.user._id);
  res.status(201).json(category);
}));

/**
 * @swagger
 * /api/categories/{id}:
 *   patch:
 *     summary: Actualizar categoria
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la categoria
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
 *               color:
 *                 type: string
 *               active:
 *                 type: boolean
 *           example:
 *             name: Alumbrado
 *             description: Fallas de luminarias publicas
 *             color: "#facc15"
 *             active: true
 *     responses:
 *       200:
 *         description: Categoria actualizada correctamente
 */
router.patch("/:id", asyncHandler(async (req, res) => {
  const category = await service.update(req.params.id, req.body);
  res.json(category);
}));

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Eliminar categoria
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la categoria
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoria eliminada correctamente
 */
router.delete("/:id", asyncHandler(async (req, res) => {
  const result = await service.delete(req.params.id);
  res.json(result);
}));

module.exports = router;
