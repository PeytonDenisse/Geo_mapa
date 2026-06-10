const Location = require("../models/Location");
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

function buildLocationData(data, owner) {
  const latitude = Number(data.latitude);
  const longitude = Number(data.longitude);

  if (!data.name || !data.description || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    throw createError(400, "Nombre, descripcion, latitud y longitud son obligatorios.");
  }

  return {
    name: data.name,
    description: data.description,
    latitude,
    longitude,
    location: {
      type: "Point",
      coordinates: [longitude, latitude]
    },
    category: data.category || undefined,
    owner
  };
}

class LocationService {
  async getAll() {
    return Location.find()
      .sort({ createdAt: -1 })
      .populate("category", "name color description")
      .populate("owner", "name email");
  }

  async searchByName(name) {
    if (!name) {
      throw createError(400, "Escribe un nombre para buscar.");
    }

    return Location.find({
      name: {
        $regex: name,
        $options: "i"
      }
    }).sort({ name: 1 });
  }

  async getById(id) {
    const location = await Location.findById(id).populate("owner", "name email");

    if (!location) {
      throw createError(404, "Ubicacion no encontrada.");
    }

    if (data.category) {
      await Report.updateMany({ location: id }, { category: data.category });
    }

    return location;
  }

  async create(data, userId) {
    await ensureCategory(data.category);
    return Location.create(buildLocationData(data, userId));
  }

  async update(id, data) {
    const updateData = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) {
      await ensureCategory(data.category);
      updateData.category = data.category || null;
    }

    if (data.latitude !== undefined || data.longitude !== undefined) {
      const latitude = Number(data.latitude);
      const longitude = Number(data.longitude);

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        throw createError(400, "Latitud y longitud deben ser numericas.");
      }

      updateData.latitude = latitude;
      updateData.longitude = longitude;
      updateData.location = {
        type: "Point",
        coordinates: [longitude, latitude]
      };
    }

    const location = await Location.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!location) {
      throw createError(404, "Ubicacion no encontrada.");
    }

    return location;
  }

  async delete(id) {
    const location = await Location.findByIdAndDelete(id);

    if (!location) {
      throw createError(404, "Ubicacion no encontrada.");
    }

    return {
      message: "Ubicacion eliminada con exito."
    };
  }
}

module.exports = LocationService;
