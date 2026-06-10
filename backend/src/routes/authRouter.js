const express = require("express");
const AuthService = require("../services/authService");
const asyncHandler = require("../middlewares/asyncHandler");

const router = express.Router();
const service = new AuthService();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Registro e inicio de sesion
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             name: Denisse
 *             email: denisse@gmail.com
 *             password: "123456"
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente y token generado
 *       400:
 *         description: Datos invalidos
 */
router.post("/register", asyncHandler(async (req, res) => {
  const result = await service.register(req.body);
  res.status(201).json(result);
}));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesion
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRequest'
 *           example:
 *             email: denisse@gmail.com
 *             password: "123456"
 *     responses:
 *       200:
 *         description: Login correcto. Copia el token y usalo en Authorize como Bearer token.
 *       401:
 *         description: Credenciales incorrectas
 */
router.post("/login", asyncHandler(async (req, res) => {
  const result = await service.login(req.body);
  res.json(result);
}));

module.exports = router;
