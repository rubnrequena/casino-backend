const mongoose = require("mongoose");
const esquema = new mongoose.Schema({
  ticket: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  pagado: {
    type: Date,
    required: true,
    default: new Date(),
  },
  responsable: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
});
module.exports = mongoose.model("Pagado", esquema);
