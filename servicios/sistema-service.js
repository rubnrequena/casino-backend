const juegoModel = require("_modelos/juego-model");
const RedisCache = require("../dto/redis-cache.dto");
const redisRepo = require("../repositorio/redis-repo");
const sistemaRepo = require("../repositorio/sistema-repo");

module.exports = {
  juegos: {
    /**
     * @param {String} nombre
     */
    nuevo(nombre) {
      return new Promise((resolve, reject) => {
        new juegoModel({ nombre }).save((error, juego) => {
          if (error) return reject(error.message);
          resolve(juego);
        });
      });
    },
  },
  /**
   * return {Primise<Object>}
   */
  async stats() {
    let stat = await redisRepo.hget_all(RedisCache.ESTADISTICAS);
    let saldos = await redisRepo.hget_all(RedisCache.BALANCE);
    let monedas = await redisRepo.hget_all(RedisCache.BALANCE_MONEDA);
    let balance = {};
    let monto = 0,
      moneda;
    for (const usuario in saldos) {
      monto = Number(saldos[usuario]);
      moneda = monedas[usuario];
      if (balance[moneda]) balance[moneda] += monto;
      else balance[moneda] = monto;
    }
    stat.balance = balance;
    return stat;
  },
  permisos: {
    nuevo() {},
    todos() {
      return sistemaRepo.permiso.todos();
    },
  },
};
