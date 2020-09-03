const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const esquema = new mongoose.Schema({
  usuario: {
    type: ObjectId,
    required: true,
    ref: "Usuario",
  },
  entidad: {
    type: String,
    required: true,
  },
  moneda: {
    type: String,
    enum: ["ves", "usd", "eur", "btc"],
    required: true,
  },
  direccion: {
    type: String,
    required: true,
  },
  meta: {
    type: String,
    maxlength: 512,
  },
  activo: {
    type: Boolean,
    default: true,
  },
  verificado: {
    type: Boolean,
    default: false,
  },
  verificadoEl: {
    type: Date,
  },
  verificadoPor: {
    type: ObjectId,
    ref: "Usuario",
  },
});
module.exports = mongoose.model("Metodo", esquema);
