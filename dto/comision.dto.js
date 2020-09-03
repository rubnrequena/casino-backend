class Comision {
  static COMISION = 0;
  static PARTICIPACION = 1;

  /** @type {String} */ _id;
  /** @type {String} */ tipo;
  /** @type {String} */ usuario;
  /** @type {Number} */ comision;
  /** @type {String} */ operadora;
  /** @type {Date} */ creado;
}
module.exports = Comision;
