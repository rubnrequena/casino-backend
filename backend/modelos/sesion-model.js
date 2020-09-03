const mongoose = require('mongoose');
const esquema = new mongoose.Schema({
  usuario: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  agente: {
    type: Object,
    required: true
  }
})
module.exports = mongoose.model("Sesion", esquema)