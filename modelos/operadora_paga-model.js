const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const esquema = new mongoose.Schema({
  operadora: {
    type: ObjectId,
    required: true,
  },
  usuario: {
    type: ObjectId,
    required: true,
  },
  monto: {
    type: Number,
    required: true,
  },
});
module.exports = mongoose.model("Operadoras_paga", esquema);
