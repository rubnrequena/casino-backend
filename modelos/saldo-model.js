const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId
const esquema = new mongoose.Schema({
  usuario: {
    type: [ObjectId],
    required: true,
    index: true
  },
  descripcion: {
    type: String,
    required: true,
  },
  tiempo: {
    type: Date,
    required: true,
  },
  monto: {
    type: Number,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
  },
  hash: {
    type: String,
    required: true,
    index: true
  },
  prevHash: {
    type: String,
    required: true,
  },
})
module.exports = mongoose.model("Saldo", esquema)