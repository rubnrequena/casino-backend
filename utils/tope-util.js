const Usuario = require("../dto/usuario-dto");

const NIVELES = {
  master: 100,
  operadora: 50,
  multi: 40,
  banca: 30,
  grupo: 20,
  agencia: 10,
  agente: 50,
  online: 10,
};

module.exports = {
  /**
   * @param {String} nivel
   * @param {String} sorteo
   * @param {String} numero
   * @returns {Number}
   */
  calcularOrden(nivel, sorteo, numero) {
    /** @type {Number} */
    let orden = NIVELES[nivel];
    if (sorteo) orden--;
    if (numero) orden--;
    return orden;
  },
  /**
   * @param {String} rol
   */
  calcularNivel(rol) {
    switch (rol) {
      case Usuario.ONLINE:
        return 1;
      case Usuario.AGENCIA:
        return 1;
      case Usuario.GRUPO:
        return 2;
      case Usuario.BANCA:
        return 3;
      case Usuario.MULTI:
        return 4;
      case Usuario.AGENTE:
        return 4;
      case Usuario.MASTER:
        return 5;
      case Usuario.AUDITOR:
        return 5;
    }
  },
};
