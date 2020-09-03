const Sorteo = require("../dto/sorteo-dto");

module.exports = {
  /**
   * @param {Sorteo} sorteo
   * @returns {Boolean}
   */
  estaAbierto(sorteo) {
    const ahora = new Date();
    return ahora < sorteo.cierra && sorteo.abierta == true;
  },
};
