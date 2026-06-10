const UrbanRoute = require("../models/UrbanRoute");
const Category = require("../models/Category");
const Report = require("../models/Report");
const createError = require("./createError");

async function ensureCategory(id) {
  if (!id) return;

  const category = await Category.findById(id);
  if (!category) {
    throw createError(404, "La categoria asociada no existe.");
  }
}

function normalizePoints(points) {
  if (!Array.isArray(points) || points.length < 2) {
    throw createError(400, "La ruta debe tener al menos 2 puntos.");
  }

  return points.map((point) => {
    const lat = Number(point.lat);
    const lng = Number(point.lng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      throw createError(400, "Todos los puntos deben tener lat y lng numericos.");
    }

    return { lat, lng };
  });
}

class RouteService {
  async getAll() {
    return UrbanRoute.find()
      .sort({ createdAt: -1 })
      .populate("category", "name color description")
      .populate("owner", "name email");
  }

  async create(data, userId) {
    if (!data.name) {
      throw createError(400, "El nombre de la ruta es obligatorio.");
    }

    await ensureCategory(data.category);

    return UrbanRoute.create({
      name: data.name,
      description: data.description || "",
      points: normalizePoints(data.points),
      category: data.category || undefined,
      owner: userId
    });
  }

  async update(id, data) {
    const updateData = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.points !== undefined) updateData.points = normalizePoints(data.points);
    if (data.category !== undefined) {
      await ensureCategory(data.category);
      updateData.category = data.category || null;
    }

    const route = await UrbanRoute.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!route) {
      throw createError(404, "Ruta no encontrada.");
    }

    if (data.category) {
      await Report.updateMany({ route: id }, { category: data.category });
    }

    return route;
  }

  async delete(id) {
    const route = await UrbanRoute.findByIdAndDelete(id);

    if (!route) {
      throw createError(404, "Ruta no encontrada.");
    }

    return {
      message: "Ruta eliminada con exito."
    };
  }
}

module.exports = RouteService;
