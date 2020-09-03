const mongoose = require('mongoose');
const esquema = new mongoose.Schema({
  usuario: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'Usuario'
  },
  creado: {
    type: Date,
    required: true,
    default: new Date()
  },
  sorteo: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'Sorteo'
  },
  numero: {
    type: String,
    required: true,
  },
  monto: {
    type: Number,
    required: true,
  },
  operadora: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'Operadora'
  },
})
module.exports = mongoose.model("Cupo", esquema)