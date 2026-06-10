const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema(
  {
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    lng: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  {
    _id: false
  }
);

const zoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    points: {
      type: [pointSchema],
      validate: {
        validator(points) {
          return points.length >= 3;
        },
        message: "Una zona necesita al menos 3 puntos."
      }
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category"
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Zone", zoneSchema);
