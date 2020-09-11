const mongoose = require("mongoose");
const permisoModel = require("./permiso-model");
const ObjectID = mongoose.Types.ObjectId;
const esquema = new mongoose.Schema({
  usuario: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    maxlength: 20,
  },
  clave: {
    type: String,
    required: true,
  },
  nombre: {
    type: String,
    required: true,
  },
  creado: {
    type: Date,
    default: new Date(),
  },
  correo: {
    type: String,
    required: true,
    unique: true,
  },
  cedula: {
    type: String,
    required: true,
    unique: true,
  },
  telefono: {
    type: String,
  },
  rol: {
    type: String,
    required: true,
    enum: [
      "master",
      "operadora",
      "multi",
      "banca",
      "grupo",
      "agencia",
      "taquilla",
      "agente",
      "online",
      "auditor",
    ],
  },
  activo: {
    type: Boolean,
    default: true,
  },
  papelera: {
    type: Boolean,
    default: false,
  },
  jerarquia: {
    type: [ObjectID],
    required: true,
  },
  comision: {
    type: Number,
    validate: (n) => n >= 0,
    default: 0,
  },
  participacion: {
    type: Number,
    default: 0,
  },
  utilidad: {
    type: Number,
    default: 0,
  },
  moneda: {
    type: String,
    default: "ves",
    enum: ["ves", "usd", "real", "eur"],
  },
  permisos: {
    type: ObjectID,
    ref: "Permiso",
  },
  menu: {
    type: ObjectID,
    ref: "Permiso",
  },
  codigo: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },
  meta: Object,
});
module.exports = mongoose.model("Usuario", esquema);
