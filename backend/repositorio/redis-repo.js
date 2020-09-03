const redis = require("redis");
const client = redis.createClient();

client.on("error", function (error) {
  console.error(error);
});

function leer(llave) {
  return new Promise((resolve, reject) => {
    client.get(llave, function (err, reply) {
      if (err) return reject(err);
      resolve(reply);
    });
  });
}

function escribir(llave, valor) {
  return new Promise((resolve, reject) => {
    client.set(String(llave), valor, function (err, reply) {
      if (err) return reject(err);
      resolve(reply);
    });
  });
}

module.exports = {
  /**JSDoc
   * @param {String} llave
   * @param {String} valor
   * @returns {Promise<String>}
   */
  str(llave, valor) {
    return new Promise(async (resolve) => {
      if (!valor) resolve(await leer(llave));
      else resolve(await escribir(llave, valor));
    });
  },
  /**JSDoc
   * @param {String} llave
   * @param {Number} valor
   * @returns {Promise<Number>}
   */
  int(llave, valor) {
    return new Promise(async (resolve) => {
      if (!valor) resolve(parseInt((await leer(llave)) || 0));
      else resolve(await escribir(llave, valor.toString()));
    });
  },
  /**JSDoc
   * @param {String} llave
   * @param {Number} valor
   * @returns {Promise<Number>}
   */
  number(llave, valor) {
    return new Promise(async (resolve) => {
      if (!valor) resolve(parseFloat((await leer(llave)) || 0));
      else resolve(await escribir(llave, valor.toString()));
    });
  },
  /**JSDoc
   * @param {String} llave
   * @param {Object} valor
   * @returns {Promise<Object>}
   */
  json(llave, valor, serializar = serializador) {
    return new Promise(async (resolve) => {
      if (!valor) {
        valor = await leer(llave);
        resolve(valor == null ? null : serializar(JSON.parse(valor)));
      } else {
        resolve(await escribir(llave, JSON.stringify(valor)));
      }
    });
  },
  /**JSDoc
   * @param {String} llave
   * @param {Array} valor
   * @returns {Array}
   */
  arreglo(llave, valor) {
    return new Promise(async (resolve) => {
      if (!valor) resolve(await JSON.parse(leer(llave)));
      else resolve(await escribir(llave, JSON.stringify(valor)));
    });
  },
  /**JSDoc
   * @param {String} llave
   * @param {Number=} valor
   * @returns {Promise<Number>}
   */
  incrementar(llave, valor = 1) {
    return new Promise((resolve, reject) => {
      client.incrby(llave, valor, (error, reply) => {
        if (error) return reject(error);
        resolve(reply);
      });
    });
  },
  /**JSDoc
   * @param {String} llave
   * @param {Number=} valor
   * @returns {Number}
   */
  disminuir(llave, valor = 1) {
    return new Promise((resolve, reject) => {
      client.decrby(llave, valor, (error, reply) => {
        if (error) return reject(error);
        resolve(reply);
      });
    });
  },
  hjson(llave, nombre, valor) {
    nombre = nombre.toString();
    return new Promise(async (resolve, reject) => {
      if (!valor) {
        client.hget(llave, nombre, (error, reply) => {
          if (error) return reject(error);
          resolve(JSON.parse(reply));
        });
      } else {
        client.hset(llave, nombre, JSON.stringify(valor), (error, reply) => {
          if (error) return reject(error);
          resolve(reply);
        });
      }
    });
  },
  hset(llave, nombre, valor) {
    nombre = nombre.toString();
    return new Promise(async (resolve, reject) => {
      client.hset(llave, nombre, valor, (error, reply) => {
        if (error) return reject(error);
        resolve(reply);
      });
    });
  },
  hset_args(llave, ...args) {
    return new Promise(async (resolve, reject) => {
      client.hmset(llave, args, (error, reply) => {
        if (error) return reject(error);
        resolve(reply);
      });
    });
  },
  /**
   *
   * @param {String} llave
   * @param {String} nombre
   * @param {String} cast
   * @return {Promise<String|Number|Object>}
   */
  hget(llave, nombre, cast) {
    return new Promise((resolve, reject) => {
      nombre = nombre.toString();
      client.hget(llave, nombre, (error, reply) => {
        if (error) return reject(error);
        if (cast) resolve(castFunctions[cast](reply));
        resolve(reply);
      });
    });
  },
  hget_all(llave) {
    return new Promise((resolve, reject) => {
      client.hgetall(llave, (error, reply) => {
        if (error) return reject(error);
        resolve(reply);
      });
    });
  },
  hincrby(llave, nombre, valor) {
    return new Promise(async (resolve, reject) => {
      valor = Number(valor);
      if (isNaN(valor)) return reject(`hincrby: numero invalido '${valor}`);
      nombre = nombre.toString();
      client.hincrby(llave, nombre, valor, (error, reply) => {
        if (error) return reject(error);
        resolve(reply);
      });
    });
  },
  expire(hash, seconds) {
    return new Promise((resolve, reject) => {
      client.expire(hash, seconds, (error, reply) => {
        if (error) return reject(error);
        resolve(reply);
      });
    });
  },
  del(hash) {
    return new Promise((resolve, reject) => {
      client.del(hash, (error, reply) => {
        if (error) return reject(error);
        resolve(reply);
      });
    });
  },
  flush() {
    return new Promise((resolve, reject) => {
      client.flushall((error) => {
        if (error) return reject(error);
        resolve();
      });
    });
  },
};

function serializador(data) {
  return data;
}

const castFunctions = {
  number: (value) => Number(value),
  json: (value) => JSON.parse(value),
};
