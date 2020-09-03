const Venta = require("./venta-dto");

class VentaTope extends Venta {
  /** @type {String} */
  hash
  /** @type {Number} */
  jugado
  /** @type {String} */
  operadora

  /** @type {String} */
  agenciaHash
  /** @type {Number} */
  agenciaJugado

  /** @type {String} */
  grupoHash
  /** @type {Number} */
  grupoJugado

  /** @type {String} */
  bancaHash
  /** @type {Number} */
  bancaJugado

  /** @type {String} */
  comercialHash
  /** @type {Number} */
  comercialJugado

  /** @type {String} */
  operadoraHash
  /** @type {Number} */
  operadoraJugado
}
module.exports = VentaTope