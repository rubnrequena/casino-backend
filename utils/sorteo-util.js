const Sorteo = require("../dto/sorteo-dto");

module.exports = {
  /**
   * @param {Sorteo} sorteo
   * @returns {Boolean}
   */
  estaAbierto(sorteo) {
    const ahora = new Date();
    sorteo.cierra = new Date(sorteo.cierra);
    const abierto = ahora < sorteo.cierra && sorteo.abierta == true;
    return abierto;
  },
};
