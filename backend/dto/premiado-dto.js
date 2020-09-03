const Usuario = require('./usuario-dto')
const Venta = require('./venta-dto')
const Sorteo = require('./sorteo-dto')

class Premiado {
  /** @type {String} */
  _id
  /** @type {Number} */
  venta
  /** @type {Number} */
  ventaNumero
  /** @type {Number} */
  premio
  /** @type {Number} */
  numTickets
}

module.exports = Premiado