const mongoose = require("mongoose");
const esquema = new mongoose.Schema({
  icon: String,
  text: String,
  url: {
    type: String,
    unique: true,
  },
  grupo: String,
});
module.exports = mongoose.model("sys_menu", esquema);
