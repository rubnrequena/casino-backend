const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId
const esquema = new mongoose.Schema({
  numero: {
    type: String,
    required: true,
    index: true
  },
  sorteo: {
    type: ObjectId,
    required: true,
    index: true
  },
  contador: {
    type: Number,
    required: true,
  },
})
module.exports = mongoose.model("Solicitado", esquema)