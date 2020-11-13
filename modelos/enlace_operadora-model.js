const mongoose = require("mongoose");
const esquema = new mongoose.Schema({
  usuario: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Usuario",
    index: true,
  },
  nivel: {
    type: Number,
    required: true,
  },
  operadora: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Operadora",
  },
  creado: {
    type: Date,
    default: new Date(),
  },
  mostrar: {
    type: Boolean,
    required: true,
  },
});
module.exports = mongoose.model("Enlace_Operadora", esquema);
