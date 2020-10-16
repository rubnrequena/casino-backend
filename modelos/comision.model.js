const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const esquema = new mongoose.Schema({
  usuario: {
    type: ObjectId,
    required: true,
  },
  operadora: {
    type: ObjectId,
    required: true,
  },
  comision: {
    type: Number,
    default: 0,
  },
  participacion: {
    type: Number,
    default: 0,
  },
  utilidad: {
    type: Number,
    default: 0,
  },
});
module.exports = mongoose.model("Comisiones", esquema);
