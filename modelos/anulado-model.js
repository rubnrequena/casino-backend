const mongoose = require("mongoose");
const esquema = new mongoose.Schema({
  _id: {
    type: mongoose.Types.ObjectId,
    required: true,
    index: true,
    unique: true,
  },
  anulado: {
    type: Date,
    default: new Date(),
    index: true,
  },
  responsable: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
});
module.exports = mongoose.model("Anulado", esquema);
