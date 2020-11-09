const juegoModel = require("_modelos/juego-model");
const monedaModel = require("_modelos/moneda-model");
const sys_menuModel = require("../modelos/sys_menu-model");
const sys_permisoModel = require("../modelos/sys_permiso-model");
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
  permiso: {
    async todos() {
      return await sys_permisoModel.find().lean();
    },
    nuevo(codigo, descripcion, grupo) {
      return new Promise((resolve, reject) => {
        new sys_permisoModel({
          codigo,
          descripcion,
          grupo,
        }).save((error, permiso) => {
          if (error) return reject(error.message);
          resolve(permiso);
        });
      });
    },
  },
};
