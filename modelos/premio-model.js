const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId
const esquema = new mongoose.Schema({
  ticketId: {
    type: ObjectId,
    required: true,
  },
  sorteo: {
    type: ObjectId,
    required: true,
  },
  usuario: {
    type: ObjectId,
    required: true,
  },
  premio: {
    type: Number,
    required: true,
  },
  pagado: {
    type: Boolean,
    default: false,
  },
  pagadoTiempo: {
    type: Date
  },
  creado: {
    type: Date,
    default: new Date(),
  },
})
module.exports = mongoose.model("Premio", esquema)