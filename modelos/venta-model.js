const mongoose = require("mongoose");
const esquema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Ticket",
    index: true,
  },
  numero: {
    type: String,
    required: true,
    index: true,
  },
  monto: {
    type: Number,
    required: true,
  },
  premio: {
    type: Boolean,
    default: false,
  },
  sorteo: {
    type: mongoose.Types.ObjectId,
    required: true,
    index: true,
    ref: "Sorteo",
  },
  operadora: {
    type: mongoose.Types.ObjectId,
    required: true,
    index: true,
    ref: "Operadora",
  },
  usuario: {
    type: mongoose.Types.ObjectId,
    ref: "Usuario",
    required: true,
    index: true,
  },
  jerarquia: {
    type: [mongoose.Types.ObjectId],
    required: true,
    index: true,
  },
  online: {
    type: Boolean,
    required: true,
  },
  pagado: {
    type: Boolean,
    default: false,
  },
  pagadoTiempo: Date,
  moneda: {
    type: String,
    required: true,
    index: true,
  },
  creado: {
    type: Date,
    required: true,
    index: true,
  },
});
module.exports = mongoose.model("Venta", esquema);
