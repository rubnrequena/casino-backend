const Sorteo = require("./sorteo-dto");

class OperadoraSorteo {
  static ANIMAL = "animal";
  static TERMINAL = "terminal";
  static TRIPLE = "triple";

  /** @type {String} */
  _id;
  /** @type {String} */
  nombre;
  /** @type {String} */
  tipo;
  /** @type {Sorteo[]} */
  sorteos;
}
module.exports = OperadoraSorteo;
