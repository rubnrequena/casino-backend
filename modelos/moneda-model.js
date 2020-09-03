const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const esquema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
  },
  siglas: {
    type: String,
    required: true,
    maxlength: 3,
    unique: true,
  },
  principal: {
    type: Boolean,
    required: true,
  },
});
module.exports = mongoose.model("Moneda", esquema);
