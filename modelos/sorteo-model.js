const mongoose = require("mongoose");
const esquema = new mongoose.Schema({
  descripcion: {
    type: String,
    required: true,
  },
  fecha: {
    type: String,
    validate: /\d{4}-\d{2}-\d{2}/,
    required: true,
    index: true,
  },
  cierra: {
    type: Date,
    required: true,
  },
  abierta: {
    type: Boolean,
    required: true,
    default: true,
  },
  ganador: {
    type: String,
    validate: /d{2,3}/,
  },
  operadora: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Operadora",
  },
});
module.exports = mongoose.model("Sorteo", esquema);
