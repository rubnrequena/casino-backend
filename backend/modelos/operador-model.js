const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const esquema = new mongoose.Schema({
  usuario: {
    type: ObjectId,
    required: true,
    ref: "Usuario",
    index: true,
  },
  operadora: {
    type: ObjectId,
    required: true,
    ref: "Operadora",
  },
  creado: {
    type: Date,
    required: true,
  },
  responsable: {
    type: ObjectId,
    required: true,
    ref: "Usuario",
  },
});
module.exports = mongoose.model("Operador", esquema);
