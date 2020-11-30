const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types

const ventaModel = require('_modelos/venta-model');

const Sorteo = require("../dto/sorteo-dto");

const redis = require('./redis-repo')
const sorteoRepo = require('./sorteo-repo');


/**
 * @param {String} sorteoId
 * @return {Promise<Sorteo>} 
 */
function sorteo(sorteoId) {
  return new Promise((resolve, reject) => {
    redis.hjson('cache-sorteo', sorteoId).then(async sorteo => {
      if (sorteo) return resolve(sorteo)
      else resolve(await mongoFallBack(sorteoId))
    }).catch(async () => {
      //TODO: notificar error de redis
      resolve(await mongoFallBack(sorteoId))
    })

    function mongoFallBack(sorteoId) {
      return sorteoRepo.buscar.id(sorteoId).then(sorteo => {
        redis.hjson('cache-sorteo', sorteoId, sorteo)
        return sorteo
      })
    }
  });
}
/**
 * @param {String} taquillaId 
 */
function ultimo_ticket(taquillaId) {
  taquillaId = taquillaId.toString()
  return new Promise((resolve, reject) => {
    redis.hjson("cache-ultimoticket", taquillaId).then(async ticket => {
      if (ticket) return resolve(ticket)
      ventaModel.aggregate([
        { $match: { usuario: ObjectId(taquillaId) } },
        {
          $group: {
            _id: "$ticketId",
            monto: { $sum: "$monto" },
            jugadas: { $sum: 1 },
            creado: { $first: "$creado" }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 1 }
      ], (error, result) => {
        if (error) return reject(error.message)
        result.nonce = true;
        redis.hjson("cache-ultimoticket", taquillaId, result)
        resolve(result)
      })
    })
  });
}

module.exports = {
  sorteo,
  tickets: {
    ultimo: ultimo_ticket
  }
};
