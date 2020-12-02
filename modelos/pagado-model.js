const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId
const esquema = new mongoose.Schema({
  _id: {
    type: ObjectId,
    required: true,
  },
  ticket: {
    type: ObjectId,
    required: true,
  },
  numero: {
    type: String,
    required: true,
  },
  pagado: {
    type: Date,
    required: true,
    default: new Date(),
  },
  responsable: {
    type: ObjectId,
    required: true,
  },
});
module.exports = mongoose.model("Pagado", esquema);
