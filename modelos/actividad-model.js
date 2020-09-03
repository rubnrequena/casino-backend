const mongoose = require('mongoose');
const esquema = new mongoose.Schema({
  usuario: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'Usuario'
  },
  origen: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  actividad: {
    type: String,
    required: true,
  },
  creado: {
    type: Date,
    required: true,
    default: new Date()
  },
})
module.exports = mongoose.model("Actividad", esquema)