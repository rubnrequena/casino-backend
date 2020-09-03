const mongoose = require('mongoose');
const esquema = new mongoose.Schema({
  origen: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'Usuario',
    index: true
  },
  destino: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'Usuario',
    index: true
  },
  contenido: {
    type: String,
    required: true,
  },
  creado: {
    type: Date,
    required: true,
    default: new Date()
  },
  leido: {
    type: Boolean,
    required: true,
    default: false
  },
  emision: {
    type: Boolean,
    required: true,
    default: false
  },
})
module.exports = mongoose.model("Mensaje", esquema)