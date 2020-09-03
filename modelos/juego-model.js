const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const esquema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
  },
});
module.exports = mongoose.model("Juego", esquema);
