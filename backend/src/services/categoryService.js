const Category = require("../models/Category");
const createError = require("./createError");

const defaultCategories = [
  { name: "Bache", description: "Daños en pavimento, hundimientos o hoyos.", color: "#f97316" },
  { name: "Alumbrado", description: "Luminarias fundidas o fallas de iluminacion.", color: "#facc15" },
  { name: "Basura", description: "Acumulacion de basura o residuos en via publica.", color: "#22c55e" },
  { name: "Señalización", description: "Señales dañadas, ausentes o mal ubicadas.", color: "#60a5fa" }
];

class CategoryService {
  async ensureDefaults() {
    const count = await Category.countDocuments();

    if (count === 0) {
      await Category.insertMany(defaultCategories);
    }
  }

  async getAll() {
    await this.ensureDefaults();
    return Category.find().sort({ name: 1 }).populate("user", "name email");
  }

  async create(data, userId) {
    if (!data.name) {
      throw createError(400, "El nombre de la categoria es obligatorio.");
    }

    const exists = await Category.findOne({ name: data.name.trim() });

    if (exists) {
      throw createError(409, "Ya existe una categoria con ese nombre.");
    }

    return Category.create({
      name: data.name,
      description: data.description || "",
      color: data.color || "#60a5fa",
      active: data.active !== undefined ? data.active : true,
      user: userId
    });
  }

  async update(id, data) {
    const category = await Category.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    });

    if (!category) {
      throw createError(404, "Categoria no encontrada.");
    }

    return category;
  }

  async delete(id) {
    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      throw createError(404, "Categoria no encontrada.");
    }

    return {
      message: "Categoria eliminada con exito."
    };
  }
}

module.exports = CategoryService;
