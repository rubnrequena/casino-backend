const topeRepo = require("../repositorio/tope-repo");
const usuarioRepo = require("../repositorio/usuario-repo");
const redisRepo = require("../repositorio/redis-repo");

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
      let topeValido = false;
      let operadoras = ventas.reduce((rventas, venta) => {
        if (rventas.indexOf(venta.operadora) == -1)
          rventas.push(venta.operadora);
        return rventas;
      }, []);
      let topesOperadora = {};
      await syncForEach(operadoras, async (operadora) => {
        //const hash = md5(taquilla._id + operadora);
        topesOperadora[operadora] = await topeRepo.buscar.paraVender(
          taquilla,
          operadora
        );
      });
      var montoJugado;
      var montoActual;
      for (let i = 0; i < ventas.length; i++) {
        var venta = ventas[i];
        const topes = topesOperadora[venta.operadora];
        for (let j = 0; j < topes.length; j++) {
          const tope = topes[j];
          montoActual = await buscarMontoJugado(venta, tope);
          montoJugado = montoActual + venta.monto;
          if (String(tope.sorteo) == venta.sorteo || tope.sorteo == null) {
            if (tope.numero == venta.numero || tope.numero == null) {
              if (montoJugado > tope.monto) {
                return reject({ error: "Venta excede tope", venta });
              } else topeValido = true;
            }
          }
        }
      }
      if (topeValido) resolve();
      else {
        reject("venta exede tope");
      }
    });
  },
};
/**
 *
 * @param {Venta} venta
 * @param {Tope} tope
 */
async function buscarMontoJugado(venta, tope) {
  const hashVenta = `${venta.sorteo}_${tope.usuario.toString()}_${
    venta.moneda
  }`;
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
