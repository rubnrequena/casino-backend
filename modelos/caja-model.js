const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId
const esquema = new mongoose.Schema({
  usuario: {
    type: ObjectId,
    required: true,
    index: true,
  },
  fecha: {
    type: Date,
    required: true,
    index: true
  },
  reporte: [
    {
      sorteo: {
        type: ObjectId,
        required: true,
      },
      sorteoNombre: {
        type: String,
        required: true,
      },
      operadora: {
        type: ObjectId,
        required: true,
      },
      monto: {
        type: Number,
        required: true,
      },
      premio: {
        type: Number,
        required: true,
      },
      pagado: {
        type: Number,
        required: true,
      },
      comision: {
        type: Number,
        required: true,
      },
      tickets: {
        type: Number,
        required: true,
      },
    }
  ]
})
module.exports = mongoose.model("Caja", esquema)