const topeRepo = require("../repositorio/tope-repo");
const usuarioRepo = require("../repositorio/usuario-repo");
const redisRepo = require("../repositorio/redis-repo");

const Tope = require("../dto/tope-dto");
const Usuario = require("../dto/usuario-dto");
const Venta = require("../dto/venta-dto");
const { syncForEach } = require("../utils/array-util");
const RedisCache = require("../dto/redis-cache.dto");
const ticketRepo = require("../repositorio/ticket-repo");
module.exports = {
  /**JSDoc
   * @param {String} usuarioId
   * @param {String} nivel
   * @param {Number} monto
   * @param {String} operadora
   * @param {String} sorteo
   * @param {String} numero
   * @param {Usuario} responsable
   * @returns {Promise<Tope>}
   */
  async nuevo(usuarioId, monto, operadora, sorteo, numero, responsable) {
    const usuario = await usuarioRepo.findById(usuarioId);
    return topeRepo.nuevo(
      usuario,
      monto,
      operadora,
      sorteo,
      numero,
      responsable
    );
  },
  editar(topeId, campos) {
    return topeRepo.editar(topeId, campos);
  },
  remover(topeId) {
    return topeRepo.remover(topeId);
  },
  /**JSDoc
   * @param {Venta[]} ventas
   * @param {Usuario} taquilla
   * @returns {Promise<Venta>}
   * @throws {String}
   */
  validar(ventas, taquilla) {
    return new Promise(async (resolve, reject) => {
      let operadoras = ventas.reduce((rventas, venta) => {
        if (rventas.indexOf(venta.operadora) == -1)
          rventas.push(venta.operadora);
        return rventas;
      }, []);
      let topesOperadora = {};
      await syncForEach(operadoras, async (operadora) => {
        topesOperadora[operadora] = await topeRepo.buscar.paraVender(
          taquilla,
          operadora
        );
      });
      for (let i = 0; i < ventas.length; i++) {
        const venta = ventas[i];
        const topes = topesOperadora[venta.operadora];
        for (let j = 0; j < topes.length; j++) {
          const tope = topes[j];
          let montoJugado = await buscarMontoJugado(venta, tope);
          montoJugado = montoJugado + venta.monto;
          if (String(tope.sorteo) == venta.sorteo || tope.sorteo == null)
            if (tope.numero == venta.numero || tope.numero == null)
              if (montoJugado > tope.monto)
                return reject({ error: "Venta excede tope", venta });
        }
      }
      resolve();
    });
  },
};
/**
 *
 * @param {Venta} venta
 * @param {Tope} tope
 */
async function buscarMontoJugado(venta, tope) {
  const hashVenta = `${venta.sorteo}_${tope.usuario.toString()}`;
  let monto = await redisRepo.hget(hashVenta, venta.numero);
  if (monto) return Number(monto);
  else {
    monto = await ticketRepo.buscar.usuarioJugado_numero(
      String(tope.usuario),
      venta.sorteo,
      venta.numero
    );
    return monto;
  }
}
