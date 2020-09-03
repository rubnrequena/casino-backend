const Usuario = require("./usuario-dto")
const Sorteo = require("./sorteo-dto")

class Reporte {
  /** @type {Date} */
  fecha
  /** @type {Usuario} */
  usuario
  /** @type {Number} */
  venta
  /** @type {Number} */
  premio
  /** @type {Comision} */
  comision
  /** @type {Participacion} */
  participacion
  /** @type {Sorteo} */
  sorteo
  /** @type {String} */
  operadora
  /** @type {jerarquia} */
  jerarquia
}
module.exports = Reporte

class Comision {
  /** @type {Number} */
  taquilla
  /** @type {Number} */
  agencia
  /** @type {Number} */
  grupo
  /** @type {Number} */
  banca
  /** @type {Number} */
  multi
  /** @type {Number} */
  operadora
}
class Participacion {
  /** @type {Number} */
  agencia
  /** @type {Number} */
  grupo
  /** @type {Number} */
  banca
  /** @type {Number} */
  multi
  /** @type {Number} */
  operadora
}