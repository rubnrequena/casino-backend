const ventaModel = require("_modelos/venta-model");
const Usuario = require("../dto/usuario-dto");
const Venta = require("../dto/venta-dto");
const redisRepo = require("./redis-repo");

const UN_DIA = 86400;

/**
 * @param {String} usuarioId
 * @param {Venta} venta
 * @param {String} moneda
 */
function incrementar(usuarioId, venta, moneda) {
  return new Promise((resolve, reject) => {
    hash = `${venta.sorteo}_${usuarioId}_${moneda}`;
    redisRepo
      .hincrby(hash, venta.numero, venta.monto)
      .then((result) => {
        redisRepo.expire(hash, UN_DIA);
        resolve(result);
      })
      .catch((error) => reject(error));
  });
}
/**
 * @param {String} usuarioId
 * @param {String} sorteoId
 * @param {String} numero
 * @param {Number} monto
 */
function disminuir(usuarioId, venta) {
  return new Promise((resolve, reject) => {
    hash = `${venta.sorteo}_${usuarioId}_${venta.moneda}`;
    redisRepo
      .hincrby(hash, venta.numero, Math.abs(venta.monto) * -1)
      .then((result) => {
        redisRepo.expire(hash, UN_DIA);
        resolve(result);
      })
      .catch((error) => reject(error));
  });
}
/**
 * @param {String} ticketId
 * @param {String} numero
 * @returns {Promise<Venta>}
 */
async function buscar_venta_premiada(ticketId, numero) {
  return await ventaModel.findOne({ ticketId, numero, premio: true }).lean();
}

module.exports = {
  cache: {
    incrementar,
    /**
     *
     * @param {Usuario} pos
     * @param {Venta} venta
     */
    disminuir: (pos, venta) => {
      const usuarios = [disminuir(pos._id, venta)];
      pos.jerarquia.forEach((usuario) => {
        usuarios.push(disminuir(usuario, venta));
      });
      return Promise.all(usuarios);
    },
  },
  buscar: {
    premiado: buscar_venta_premiada,
  },
};
