const ticketRepo = require("../repositorio/ticket-repo");
const topeService = require("./tope-service");
const redisRepo = require("../repositorio/redis-repo");
const sorteoRepo = require("../repositorio/sorteo-repo");

const Ticket = require("../dto/ticket-dto");
const Usuario = require("../dto/usuario-dto");
const Venta = require("../dto/venta-dto");

const sorteoUtil = require("../utils/sorteo-util");
const operadoraRepo = require("../repositorio/operadora-repo");

let cacheOperadora = {};

module.exports = {
  /** JSDoc
   * @param {Usuario} taquilla
   * @param {Array<Venta>} ventas
   * @returns {Promise<Ticket>}
   */
  nuevo(taquilla, ventas) {
    return new Promise(async (resolve, reject) => {
      const now = new Date();
      var sorteosCerrados = [];
      for (let i = 0; i < ventas.length; i++) {
        const venta = ventas[i];
        let sorteo = cacheOperadora[venta.sorteo];
        cache = true;
        if (!sorteo) {
          sorteo = await sorteoRepo.buscar.id(venta.sorteo);
          cacheOperadora[venta.sorteo] = sorteo;
          cache = false;
        }
        venta.operadora = sorteo.operadora.toString();
        const abierto = sorteoUtil.estaAbierto(sorteo);
        if (!abierto) sorteosCerrados.push(sorteo.descripcion);
      }
      if (sorteosCerrados.length > 0)
        return reject({ error: `sorteos invalidos`, sorteos: sorteosCerrados });

      topeService
        .validar(ventas, taquilla)
        .then(async () => {
          const ticket = await ticketRepo.nuevo(taquilla, ventas);
          let hash;
          ventas.forEach((venta) => {
            taquilla.jerarquia.forEach((padre) => {
              hash = `${venta.sorteo}_${padre}`;
              redisRepo.hincrby(hash, venta.numero, venta.monto);
            });
            hash = `${venta.sorteo}_${taquilla._id}`;
            redisRepo.hincrby(hash, venta.numero, venta.monto);
          });

          //TODO notificar usuarios
          resolve(ticket);
        })
        .catch((error) => reject(error));
    });
  },
  monitor: {
    async admin(sorteoId, rol, moneda) {
      let sorteo = await sorteoRepo.buscar.id(sorteoId);
      let operadora = await operadoraRepo.buscar.id(sorteo.operadora);
      return ticketRepo.monitor.admin(sorteoId, rol, operadora.paga, moneda);
    },
    async numero(sorteoId, moneda) {
      let sorteo = await sorteoRepo.buscar.id(sorteoId);
      let operadora = await operadoraRepo.buscar.id(sorteo.operadora);
      return ticketRepo.monitor.numeros(sorteoId, operadora.paga, moneda);
    },
  },
};
