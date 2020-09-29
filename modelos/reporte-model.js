const mongoose = require("mongoose");
const esquema = new mongoose.Schema({
  fecha: {
    type: Date,
    required: true,
    index: true,
  },
  usuario: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Usuario",
    index: true,
  },
  venta: {
    type: Number,
    required: true,
  },
  jerarquia: {
    type: [mongoose.Types.ObjectId],
    required: true,
  },
  premio: {
    type: Number,
    required: true,
  },
  numTickets: {
    type: Number,
    required: true,
  },
  comision: {
    taquilla: Number,
    agencia: Number,
    grupo: Number,
    banca: Number,
    comercial: Number,
    operadora: Number,
  },
  participacion: {
    agencia: Number,
    grupo: Number,
    banca: Number,
    comercial: Number,
    operadora: Number,
  },
  sorteo: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Sorteo",
    index: true,
  },
  operadora: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Operadora",
    index: true,
  },
  moneda: {
    type: String,
    required: true,
    index: true,
  },
});
module.exports = mongoose.model("Reporte", esquema);
