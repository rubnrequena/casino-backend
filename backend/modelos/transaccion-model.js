const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const esquema = new mongoose.Schema({
  usuario: {
    type: ObjectId,
    required: true,
    ref: "Usuario",
    index: true,
  },
  tipo: {
    type: String,
    required: true,
    enum: ["recarga", "retiro"],
    index: true,
  },
  tiempo: {
    type: Date,
    default: new Date(),
  },
  monto: {
    type: Number,
    required: true,
  },
  metodo: {
    type: ObjectId,
    ref: "Metodo",
    required: true,
  },
  fecha: {
    type: Date,
  },
  recibo: {
    type: String,
  },
  mensaje: {
    type: String,
    maxlength: 512,
  },
  rechazada: {
    type: Boolean,
    default: false,
  },
  rechazadaEl: {
    type: Date,
  },
  procesada: {
    type: Boolean,
    required: true,
  },
  cancelada: {
    type: Boolean,
    default: false,
  },
  procesadaEl: {
    type: Date,
  },
  jerarquia: {
    type: [ObjectId],
    required: true,
    index: true,
  },
  moneda: {
    type: String,
    required: true,
    index: true,
  },
});
module.exports = mongoose.model("Transacion", esquema);
