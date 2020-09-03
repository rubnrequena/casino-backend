const Venta = require("./venta-dto");

class Ticket {
  /** @type {String} */ _id;
  /** @type {String} */ serial;
  /** @type {String} */ codigo;
  /** @type {String} */ usuario;
  /** @type {Date} */ creado;
  /** @type {Number} */ monto;
  /** @type {Boolean} */ anulado;
  /** @type {Array<String>} */ jerarquia;
  /** @type {Array<Venta>} */ ventas;
  /** @type {String} */ moneda;
  /** @type {String} */ juego;
  /** @type {Boolean} */ online;
}
module.exports = Ticket;
