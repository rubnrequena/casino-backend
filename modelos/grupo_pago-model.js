const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const esquema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
  usuario: {
    type: ObjectId,
    required: true,
  },
});
module.exports = mongoose.model("Grupo_pago", esquema);
