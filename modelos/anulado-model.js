const mongoose = require("mongoose");
const esquema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Types.ObjectId,
    required: true,
    index: true,
    unique: true,
  },
  anulado: {
    type: Date,
    required: true,
    default: new Date(),
    index: true,
  },
});
module.exports = mongoose.model("Anulado", esquema);
