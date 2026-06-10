const Zone = require("../models/Zone");
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
  if (!Array.isArray(points) || points.length < 3) {
    throw createError(400, "La zona debe tener al menos 3 puntos.");
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

class ZoneService {
  async getAll() {
    return Zone.find()
      .sort({ createdAt: -1 })
      .populate("category", "name color description")
      .populate("owner", "name email");
  }

  async create(data, userId) {
    if (!data.name) {
      throw createError(400, "El nombre de la zona es obligatorio.");
    }

    await ensureCategory(data.category);

    return Zone.create({
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

    const zone = await Zone.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!zone) {
      throw createError(404, "Zona no encontrada.");
    }

    if (data.category) {
      await Report.updateMany({ zone: id }, { category: data.category });
    }

    return zone;
  }

  async delete(id) {
    const zone = await Zone.findByIdAndDelete(id);

    if (!zone) {
      throw createError(404, "Zona no encontrada.");
    }

    return {
      message: "Zona eliminada con exito."
    };
  }
}

module.exports = ZoneService;
