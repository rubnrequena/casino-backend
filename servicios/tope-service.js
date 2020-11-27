const topeRepo = require("../repositorio/tope-repo");
const usuarioRepo = require("../repositorio/usuario-repo");
const redisRepo = require("../repositorio/redis-repo");
const cacheRepo = require("../repositorio/cache-repo");

const Tope = require("../dto/tope-dto");
const Usuario = require("../dto/usuario-dto");
const Venta = require("../dto/venta-dto");
const { syncForEach } = require("../utils/array-util");
const RedisCache = require("../dto/redis-cache.dto");
const ticketRepo = require("../repositorio/ticket-repo");
const md5 = require("md5");
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
      let operadoras = await ventas.reduce(async (operadoras, venta) => {
        const sorteo = await cacheRepo.sorteo(venta.sorteo)
        venta.operadora = sorteo.operadora;
        let ops = await operadoras;
        if (ops.indexOf(sorteo.operadora) == -1)
          ops.push(sorteo.operadora);
        return ops;
      }, []);
      let topesOperadora = {};
      await syncForEach(operadoras, async (operadora) => {
        topesOperadora[operadora] = await topeRepo.buscar.paraVender(
          taquilla,
          operadora
        );
      });
      let montoJugado;
      let montoActual;
      let ventasRechazadas = []
      let ventasAceptadas = []
      forventa:
      for (let i = 0; i < ventas.length; i++) {
        let venta = ventas[i];
        const topes = topesOperadora[venta.operadora];
        for (let j = 0; j < topes.length; j++) {
          const tope = topes[j];
          montoActual = await buscarMontoJugado(venta, tope, taquilla.moneda);
          montoJugado = montoActual + venta.monto;
          if (String(tope.sorteo) == venta.sorteo || tope.sorteo == null) {
            if (tope.numero == venta.numero || tope.numero == null) {
              if (montoJugado > tope.monto) {
                ticketRepo.solicitados.incrementar(venta.sorteo, venta.numero)
                venta.monto = Math.max(0, tope.monto - montoActual)
                if (venta.monto == 0) {
                  ventasRechazadas.push(venta)
                  continue forventa;
                }
              }
            }
          }
        }
        ventasAceptadas.push(venta)
      }
      resolve({ aceptado: ventasAceptadas, rechazado: ventasRechazadas });
    });
  },
};
/**
 *
 * @param {Venta} venta
 * @param {Tope} tope
 */
async function buscarMontoJugado(venta, tope, moneda) {
  const hashVenta = `${venta.sorteo}_${tope.usuario.toString()}_${moneda}`;
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

let _cache = {};
/**
 *
 * @param {Usuario} usuario
 * @param {String} operadora
 */
async function cache(usuario, operadora) {
  const hash = md5(usuario._id + operadora);
  let data;
  if (_cache[hash]) {
    return _cache[hash];
  } else {
    data = await topeRepo.buscar.paraVender(usuario, operadora);
    _cache[hash] = data;
    return data;
  }
}
