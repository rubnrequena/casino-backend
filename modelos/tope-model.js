const mongoose = require("mongoose");
const esquema = new mongoose.Schema({
  monto: {
    type: Number,
    required: true,
  },
  operadora: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Operadora",
  },
  sorteo: {
    type: mongoose.Types.ObjectId,
    ref: "Sorteo",
  },
  numero: {
    type: String,
  },
  jerarquia: {
    type: [mongoose.Types.ObjectId],
    required: true,
  },
  nivel: {
    type: String,
    required: true,
  },
  orden: {
    type: Number,
    required: true,
  },
  activo: {
    type: Boolean,
    default: true,
  },
  registrado: {
    type: Date,
    default: new Date(),
  },
  responsable: {
    _id: mongoose.Types.ObjectId,
    nombre: String,
  },
});
module.exports = mongoose.model("Tope", esquema);
