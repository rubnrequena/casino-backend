const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const ventaModel = require("./venta-model");

const esquema = new mongoose.Schema({
  serial: {
    type: String,
    required: true,
    index: true,
  },
  codigo: {
    type: String,
    required: true,
  },
  usuario: {
    type: ObjectId,
    required: true,
    ref: "Usuario",
    index: true,
  },
  creado: {
    type: Date,
    required: true,
    default: new Date(),
  },
  monto: {
    type: Number,
    required: true,
  },
  anulado: {
    type: Boolean,
    default: false,
  },
  jerarquia: {
    type: [ObjectId],
    required: true,
    index: true,
  },
  ventas: {
    type: [ObjectId],
  },
  moneda: {
    type: String,
    required: true,
    enum: process.env.MONEDAS_PERMITIDAS.split(","),
  },
  juego: {
    type: ObjectId,
    required: true,
  },
  online: {
    type: Boolean,
    required: true,
  },
});
module.exports = mongoose.model("Ticket", esquema);
