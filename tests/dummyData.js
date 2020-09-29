const Sorteo = require("../dto/sorteo-dto");
const Usuario = require("../dto/usuario-dto");
const Tope = require("../dto/tope-dto");
const { trailZero, getRandomInt } = require("../utils/number-util");

module.exports = {
  /**JSDoc
   * @param {String} operadoraId
   * @param {Usuario} usuario
   * @param {Sorteo=} sorteoId
   * @param {String=} nivel
   * @param {String=} numero
   * @param {Number=} monto
   * @param {Number=} montoMax
   * @param {Number=} minimoDecimal
   * @returns {Tope}
   */
  generadorTope(
    operadoraId,
    usuario,
    sorteoId = null,
    numero = null,
    monto = 0,
    montoMax,
    minimoDecimal = 1000
  ) {
    return {
      sorteo: sorteoId,
      operadora: operadoraId,
      usuario: usuario._id,
      nivel: usuario.rol,
      monto:
        monto && montoMax
          ? getRandomInt(monto, montoMax) * minimoDecimal
          : monto * 1000,
      numero,
    };
  },
  generarVenta,
  generarVentas,
};

function generarVenta(sorteo, numero = 0, monto = 1000, numeroMax, montoMax) {
  const num = trailZero(
    numero && numeroMax ? getRandomInt(numero, numeroMax) : numero
  );
  return {
    numero: num,
    monto: monto && montoMax ? getRandomInt(monto, montoMax) : monto,
    sorteo: sorteo,
  };
}

function generarVentas(n, sorteos, sorteoInicio, sorteoFin, exp = 100) {
  let ventas = [];
  for (let i = 0; i < n; i++) {
    const sorteo = sorteos[getRandomInt(sorteoInicio, sorteoFin)];
    ventas.push(
      generarVenta(sorteo._id, getRandomInt(0, 36), getRandomInt(1, 10) * exp)
    );
  }
  return ventas;
}
