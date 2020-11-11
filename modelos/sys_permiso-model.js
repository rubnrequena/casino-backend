const mongoose = require("mongoose");
const esquema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
  grupo: {
    type: String,
    required: true,
  },
});
module.exports = mongoose.model("sys_permiso", esquema);
