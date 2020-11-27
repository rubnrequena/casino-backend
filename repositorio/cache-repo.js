const redis = require('./redis-repo')
const Sorteo = require("../dto/sorteo-dto");
const sorteoModel = require('_modelos/sorteo-model');
const sorteoRepo = require('./sorteo-repo');

/**
 * 
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

module.exports = {
  sorteo,
};
