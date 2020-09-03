const mongoose = require("mongoose");
const esquema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },
  permisos: Array,
  rol: String,
  predeterminado: Boolean,
  usuario: mongoose.Types.ObjectId,
});
module.exports = mongoose.model("Permiso", esquema);
