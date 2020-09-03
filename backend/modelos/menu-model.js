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
    maxlength: 256,
  },
  rol: {
    type: String,
    required: true,
  },
  menu: {
    type: Array,
    required: true,
  },
  usuario: {
    type: ObjectId,
  },
});
module.exports = mongoose.model("Menu", esquema);
