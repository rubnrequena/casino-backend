const mongoose = require("mongoose");
const esquema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  tipo: {
    type: String,
    required: true,
    enum: ["animal", "terminal", "triple"],
  },
  paga: {
    type: Number,
    required: true,
  },
  sorteos: {
    type: [String],
    required: true,
  },
  comision: {
    type: Number,
    default: 0,
  },
  participacion: {
    type: Number,
    default: 0,
  },
  numeros: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Numero",
  },
});
module.exports = mongoose.model("Operadora", esquema);
