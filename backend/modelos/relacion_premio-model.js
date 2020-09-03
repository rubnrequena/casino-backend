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
  monto: {
    type: Number,
    required: true,
  },
})
module.exports = mongoose.model("Relacion_Premio", esquema)