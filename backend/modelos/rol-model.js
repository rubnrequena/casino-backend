const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const esquema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
  nivel: {
    type: Number,
    required: true,
  },
  grupo: {
    type: Array,
    required: true,
  },
});
module.exports = mongoose.model("Rol", esquema);
