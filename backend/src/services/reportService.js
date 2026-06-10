const Report = require("../models/Report");
const Location = require("../models/Location");
const Zone = require("../models/Zone");
const UrbanRoute = require("../models/UrbanRoute");
const Category = require("../models/Category");
const createError = require("./createError");

async function ensureLocation(id) {
  const location = await Location.findById(id);

  if (!location) {
    throw createError(404, "La ubicacion asociada no existe.");
  }
}

async function ensureZone(id) {
  const zone = await Zone.findById(id);

  if (!zone) {
    throw createError(404, "La zona asociada no existe.");
  }
}

async function ensureRoute(id) {
  const route = await UrbanRoute.findById(id);

  if (!route) {
    throw createError(404, "La ruta asociada no existe.");
  }
}

async function ensureCategory(id) {
  const category = await Category.findById(id);

  if (!category) {
    throw createError(404, "La categoria asociada no existe.");
  }
}

async function normalizeReportTarget(data) {
  const targetType = data.targetType || (data.zone ? "zone" : data.route ? "route" : "location");
  const targetId = data.targetId || data[targetType];
  const targetData = {
    location: undefined,
    zone: undefined,
    route: undefined
  };

  if (!["location", "zone", "route"].includes(targetType) || !targetId) {
    throw createError(400, "Selecciona si el reporte corresponde a una ubicacion, zona o ruta.");
  }

  if (targetType === "location") {
    await ensureLocation(targetId);
    targetData.location = targetId;
  }

  if (targetType === "zone") {
    await ensureZone(targetId);
    targetData.zone = targetId;
  }

  if (targetType === "route") {
    await ensureRoute(targetId);
    targetData.route = targetId;
  }

  return {
    targetType,
    ...targetData
  };
}

function centroid(points = []) {
  if (!points.length) return null;

  const total = points.reduce((acc, point) => ({
    latitude: acc.latitude + Number(point.lat),
    longitude: acc.longitude + Number(point.lng)
  }), { latitude: 0, longitude: 0 });

  return {
    latitude: total.latitude / points.length,
    longitude: total.longitude / points.length
  };
}

function getReportCoordinates(report) {
  if (report.location) {
    return {
      latitude: report.location.latitude,
      longitude: report.location.longitude
    };
  }

  if (report.zone?.points) {
    return centroid(report.zone.points);
  }

  if (report.route?.points) {
    return centroid(report.route.points);
  }

  return null;
}

async function syncTargetCategory(target, category) {
  if (target.location) {
    await Location.findByIdAndUpdate(target.location, { category });
  }

  if (target.zone) {
    await Zone.findByIdAndUpdate(target.zone, { category });
  }

  if (target.route) {
    await UrbanRoute.findByIdAndUpdate(target.route, { category });
  }
}

function distanceKm(origin, destination) {
  const radius = 6371;
  const dLat = (destination.latitude - origin.latitude) * Math.PI / 180;
  const dLng = (destination.longitude - origin.longitude) * Math.PI / 180;
  const lat1 = origin.latitude * Math.PI / 180;
  const lat2 = destination.latitude * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

class ReportService {
  async getAll() {
    return Report.find()
      .sort({ createdAt: -1 })
      .populate("location", "name latitude longitude category")
      .populate("zone", "name description points category")
      .populate("route", "name description points category")
      .populate("category", "name color description")
      .populate("user", "name email");
  }

  async create(data, userId) {
    if (!data.title || !data.description || !data.category) {
      throw createError(400, "Titulo, descripcion, destino y categoria son obligatorios.");
    }

    await ensureCategory(data.category);
    const target = await normalizeReportTarget(data);
    await syncTargetCategory(target, data.category);

    return Report.create({
      title: data.title,
      description: data.description,
      priority: data.priority || "media",
      status: data.status || "pendiente",
      category: data.category,
      ...target,
      user: userId
    });
  }

  async update(id, data) {
    if (data.category) {
      await ensureCategory(data.category);
    }

    const reportToUpdate = await Report.findById(id);

    if (!reportToUpdate) {
      throw createError(404, "Reporte no encontrado.");
    }

    if (data.targetType || data.targetId || data.location || data.zone || data.route) {
      const target = await normalizeReportTarget(data);
      reportToUpdate.targetType = target.targetType;
      reportToUpdate.location = target.location;
      reportToUpdate.zone = target.zone;
      reportToUpdate.route = target.route;
    }

    if (data.title !== undefined) reportToUpdate.title = data.title;
    if (data.description !== undefined) reportToUpdate.description = data.description;
    if (data.priority !== undefined) reportToUpdate.priority = data.priority;
    if (data.status !== undefined) reportToUpdate.status = data.status;
    if (data.category !== undefined) reportToUpdate.category = data.category;

    await reportToUpdate.save();
    await syncTargetCategory(reportToUpdate, reportToUpdate.category);

    const report = await Report.findById(reportToUpdate._id)
      .populate("location", "name latitude longitude category")
      .populate("zone", "name description points category")
      .populate("route", "name description points category")
      .populate("category", "name color description")
      .populate("user", "name email");

    return report;
  }

  async getNearby(lat, lng, radiusKm = 2) {
    const latitude = Number(lat);
    const longitude = Number(lng);
    const radius = Number(radiusKm);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      throw createError(400, "Latitud y longitud son obligatorias para buscar reportes cercanos.");
    }

    const reports = await this.getAll();
    const origin = { latitude, longitude };

    return reports
      .map((report) => ({
        report,
        coordinates: getReportCoordinates(report)
      }))
      .filter((item) => item.coordinates)
      .map((report) => ({
        report: report.report,
        distanceKm: distanceKm(origin, report.coordinates)
      }))
      .filter((item) => item.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  async delete(id) {
    const report = await Report.findByIdAndDelete(id);

    if (!report) {
      throw createError(404, "Reporte no encontrado.");
    }

    return {
      message: "Reporte eliminado con exito."
    };
  }
}

module.exports = ReportService;
