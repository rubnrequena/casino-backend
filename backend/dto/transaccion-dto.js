class Transaccion {
  static TIPO_RECARGA = "recarga";
  static TIPO_RETIRO = "retiro";

  /** @type {String} */ _id;
  /** @type {String} */ usuario;
  /** @type {String} */ padre;
  /** @type {String} */ tipo;
  /** @type {Date} */ tiempo;
  /** @type {Number} */ monto;
  /** @type {String} */ metodo;
  /** @type {String} */ mensaje;
  /** @type {Boolean} */ procesada;
  /** @type {Date} */ procesadaEl;
  /** @type {Boolean} */ cancelada;
}
module.exports = Transaccion;
