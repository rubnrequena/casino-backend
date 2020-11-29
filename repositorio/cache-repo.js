const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types

const redis = require('./redis-repo')
const Sorteo = require("../dto/sorteo-dto");
const sorteoModel = require('_modelos/sorteo-model');
const sorteoRepo = require('./sorteo-repo');
const ticketModel = require('_modelos/ticket-model');

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
      ticketModel.aggregate([
        { $match: { usuario: ObjectId(taquillaId) } },
        {
          $group: {
            _id: "$ticketId",
            monto: { $sum: "$monto" },
            jugadas: { $sum: 1 }
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
