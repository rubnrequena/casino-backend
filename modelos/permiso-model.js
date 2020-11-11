const mongoose = require("mongoose");
const esquema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
  },
  permisos: {
    type: Array,
    required: true,
  },
  usuario: {
    type: mongoose.Types.ObjectId,
    index: true,
  },
  predeterminado: {
    type: Boolean,
    required: true,
    default: false,
  },
});
module.exports = mongoose.model("Permiso", esquema);
