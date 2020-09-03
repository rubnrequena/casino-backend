const mongoose = require("mongoose");
const { COMISION, PARTICIPACION } = require("../dto/comision.dto");
const ObjectId = mongoose.Types.ObjectId;
const esquema = new mongoose.Schema({
  tipo: {
    type: Number,
    required: true,
    enum: [COMISION, PARTICIPACION],
  },
  usuario: {
    type: ObjectId,
    required: true,
  },
  comision: {
    type: Number,
    required: true,
  },
  operadora: {
    type: ObjectId,
    required: true,
  },
  creado: {
    type: Date,
    required: true,
  },
  modificado: {
    type: Date,
    required: true,
  },
});
module.exports = mongoose.model("Comisiones", esquema);
