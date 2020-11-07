const juegoModel = require("_modelos/juego-model");
const monedaModel = require("_modelos/moneda-model");
const sys_menuModel = require("_modelos/sys_menu-model");
const Moneda = require("../dto/moneda-dto");

module.exports = {
  /**
   * @return {Moneda[]}
   */
  async monedas() {
    //TODO cache redis
    return await monedaModel.find().lean();
  },
  /**
   * @param {String} siglas
   * @return {Promise<Moneda>}
   */
  async moneda(siglas) {
    return await monedaModel.findOne({ siglas }).lean();
  },
  async juegos(usuarioId) {
    return await juegoModel.find().lean();
  },
  async menus() {
    return await sys_menuModel.find().lean();
  },
  menu: {
    nuevo(nombre, descripcion, menu) {},
  },
};
