const juegoModel = require("_modelos/juego-model");
const monedaModel = require("_modelos/moneda-model");

module.exports = {
  async monedas() {
    //TODO cache redis
    return await monedaModel.find().lean();
  },
  async juegos(usuarioId) {
    return await juegoModel.find().lean();
  },
};
