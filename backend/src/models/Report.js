const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    priority: {
      type: String,
      enum: ["baja", "media", "alta"],
      default: "media"
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    status: {
      type: String,
      enum: ["pendiente", "en_proceso", "resuelto"],
      default: "pendiente"
    },
    targetType: {
      type: String,
      enum: ["location", "zone", "route"],
      default: "location"
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location"
    },
    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zone"
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UrbanRoute"
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

reportSchema.pre("validate", function validateTarget(next) {
  const hasLocation = Boolean(this.location);
  const hasZone = Boolean(this.zone);
  const hasRoute = Boolean(this.route);

  if ([hasLocation, hasZone, hasRoute].filter(Boolean).length !== 1) {
    next(new Error("El reporte debe asociarse a una ubicacion, zona o ruta."));
    return;
  }

  if (hasLocation) this.targetType = "location";
  if (hasZone) this.targetType = "zone";
  if (hasRoute) this.targetType = "route";
  next();
});

module.exports = mongoose.model("Report", reportSchema);
