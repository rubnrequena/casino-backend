const mongoose = require('mongoose');
const esquema = new mongoose.Schema({
  sorteo: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'Sorteo'
  },
  usuario: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'Usuario'
  },
  publico: {
    type: Boolean,
    required: true
  },
  creado: {
    type: Date,
    required: true,
    default: new Date()
  },
})
module.exports = mongoose.model("Publicacion", esquema)