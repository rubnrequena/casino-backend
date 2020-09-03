const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const numeroEsquema = new mongoose.Schema(
  {
    numero: {
      type: String,
      required: true,
    },
    nombre: String,
  },
  { _id: false }
);

const esquema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
  },
  numeros: {
    type: [numeroEsquema],
    required: true,
  },
});
module.exports = mongoose.model("Numero", esquema);
