const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const createError = require("./createError");

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email
    },
    process.env.JWT_SECRET || "dev_secret",
    {
      expiresIn: "8h"
    }
  );
}

class AuthService {
  async register(data) {
    const { name, email, password } = data;

    if (!name || !email || !password) {
      throw createError(400, "Nombre, correo y password son obligatorios.");
    }

    if (password.length < 6) {
      throw createError(400, "El password debe tener al menos 6 caracteres.");
    }

    const exists = await User.findOne({ email: email.toLowerCase() });

    if (exists) {
      throw createError(409, "Ya existe una cuenta con ese correo.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash
    });

    return {
      user: publicUser(user),
      token: signToken(user)
    };
  }

  async login(data) {
    const { email, password } = data;

    if (!email || !password) {
      throw createError(400, "Correo y password son obligatorios.");
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw createError(401, "Credenciales incorrectas.");
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      throw createError(401, "Credenciales incorrectas.");
    }

    return {
      user: publicUser(user),
      token: signToken(user)
    };
  }
}

module.exports = AuthService;
