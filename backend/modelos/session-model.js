const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const esquema = new mongoose.Schema({
  usuario: {
    type: ObjectId,
    required: true,
    index: true,
  },
  ubicacion: {
    pais: String,
    ciudad: String,
    loc: {
      type: { type: String },
      coordinates: [Number],
    },
  },
  agente: {
    isDesktop: Boolean,
    browser: String,
    version: String,
    os: String,
  },
});
module.exports = mongoose.model("Sesion", esquema);
