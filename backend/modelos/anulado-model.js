const mongoose = require('mongoose');
const esquema = new mongoose.Schema({
  ticket: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  creado: {
    type: Date,
    required: true,
    default: new Date()
  },
})
module.exports = mongoose.model("Anulado", esquema)