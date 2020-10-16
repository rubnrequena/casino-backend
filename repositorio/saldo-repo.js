const md5 = require("md5");
const metodo_pagoModel = require("../modelos/metodo_pago-model");
const transaccionModel = require("../modelos/transaccion-model");
const saldoModel = require("../modelos/saldo-model");

const Saldo = require("../dto/saldo-dto");
const Transaccion = require("../dto/transaccion-dto");
const Usuario = require("../dto/usuario-dto");
const MetodoPago = require("../dto/metodo_pago-dto");
const redisRepo = require("./redis-repo");
const RedisCache = require("../dto/redis-cache.dto");
const mongoose = require("mongoose");
const usuarioModel = require("_modelos/usuario-model");
const ObjectId = mongoose.Types.ObjectId;

//#region Saldo
/**
 * @param {Usuario} usuario
 * @param {String} descripcion
 * @param {Number} monto
 * @returns {Promise<Saldo>}
 */
function debitar(usuario, descripcion, monto) {
  return new Promise(async (resolve, reject) => {
    const ultBalance = await ultimoSaldo(usuario._id);
    let balance;
    let hash = "genesis";
    if (ultBalance) {
      balance = ultBalance.balance - Math.abs(monto);
      hash = ultBalance.hash;
    } else balance = Math.abs(monto) * -1;
    if (balance < 0) return reject("saldo insuficiente");
    guardarSaldo(usuario, descripcion, monto * -1, balance, hash)
      .then(async (saldo) => {
        await redisRepo.hset(RedisCache.BALANCE, usuario._id, balance);
        resolve(saldo);
      })
      .catch((err) => reject(err));
  });
}
/**
 * @param {Usuario} usuario
 * @param {String} descripcion
 * @param {Number} monto
 * @returns {Promise<Saldo>}
 */
function acreditar(usuario, descripcion, monto) {
  return new Promise(async (resolve, reject) => {
    const ultBalance = await ultimoSaldo(usuario._id);
    let balance;
    let ultimoHash = "genesis";
    if (ultBalance) {
      balance = ultBalance.balance + Math.abs(monto);
      ultimoHash = ultBalance.hash;
    } else balance = Math.abs(monto);
    guardarSaldo(usuario, descripcion, monto, balance, ultimoHash)
      .then((saldo) => {
        redisRepo.hset(RedisCache.BALANCE, usuario._id, balance);
        resolve(saldo);
      })
      .catch((err) => reject(err));
  });
}
/**
 * @param {Usuario} usuario
 * @param {String} descripcion
 * @param {Number} monto
 * @param {Number} balance
 * @returns {Promise<Saldo>}
 */
function guardarSaldo(usuario, descripcion, monto, balance, prevHash) {
  return new Promise((resolve, reject) => {
    let registro = {
      usuario: usuario._id,
      descripcion,
      monto,
      balance,
      moneda: usuario.moneda,
      tiempo: new Date(),
      prevHash,
    };
    registro.hash = firmar(registro);

    new saldoModel(registro).save((error, balance) => {
      if (error) return reject(error.message);
      resolve(balance);
    });
  });
}
/**
 * @param {String} usuarioId
 * @returns {Promise<Saldo>}
 */
async function ultimoSaldo(usuarioId) {
  return new Promise((resolve, reject) => {
    saldoModel
      .findOne({ usuario: usuarioId }, (error, saldo) => {
        if (error) return reject(error.message);
        resolve(saldo);
      })
      .sort({ tiempo: -1 })
      .limit(1);
  });
}
/**
 *
 * @param {Object} registro
 * @returns {String}
 */
function firmar(registro) {
  //TODO usar clave servidor para firmar saldo
  return md5(JSON.stringify(registro));
}
//#endregion

//#region Transacciones de Recarga/Retiro
/**
 * @param {String} transaccionId
 * @returns {Transaccion}
 */
async function transaccion_porId(transaccionId) {
  return await transaccionModel.findById(transaccionId).lean();
}
/**
 * @param {Usuario} usuario
 * @param {Number} monto
 * @param {String} metodo
 * @param {String} fecha
 * @param {String} recibo
 * @param {String} mensaje
 * @returns {Promise<Transaccion>}
 */
function recarga(usuario, monto, metodo, moneda, fecha, recibo, mensaje) {
  return new Promise((resolve, reject) => {
    new transaccionModel({
      tipo: Transaccion.TIPO_RECARGA,
      usuario: usuario._id,
      jerarquia: usuario.jerarquia,
      monto,
      metodo,
      fecha,
      recibo,
      mensaje,
      procesada: false,
      moneda,
    }).save((error, transaccion) => {
      if (error) return reject(error.message);
      resolve(transaccion);
    });
  });
}
/**
 * @param {Usuario} usuario
 * @param {Number} monto
 * @param {String} metodoId
 * @param {String} mensaje
 * @returns {Promise<Transaccion>}
 */
function retiro(usuario, monto, metodoId, moneda, mensaje) {
  return new Promise(async (resolve, reject) => {
    //const saldo = await ultimoSaldo(usuario._id);
    //if (!saldo || saldo.balance < monto) reject('saldo insuficiente')
    new transaccionModel({
      tipo: Transaccion.TIPO_RETIRO,
      usuario: usuario._id,
      jerarquia: usuario.jerarquia,
      monto,
      metodo: metodoId,
      mensaje,
      procesada: false,
      moneda,
    }).save((error, transaccion) => {
      if (error) return reject(error.message);
      resolve(transaccion);
    });
  });
}

/**
 * @param {Transaccion} transaccion
 * @param {Usuario} usuario
 * @returns {Promise<Transaccion>}
 */
function procesar(transaccion, usuario) {
  return new Promise(async (resolve, reject) => {
    if (transaccion.procesada == true)
      return reject(`transaccion procesada previamente`);
    if (transaccion.cancelada == true)
      return reject(`transaccion cancelada previamente`);
    const transId = {
      _id: transaccion._id,
    };
    const data = {
      procesada: true,
      procesadaEl: new Date(),
    };
    if (transaccion.tipo == Transaccion.TIPO_RECARGA) {
      transaccionModel.updateOne(transId, data, result);
    } else if (transaccion.tipo == Transaccion.TIPO_RETIRO) {
      const saldo = await ultimoSaldo(usuario._id);
      if (!saldo || saldo.balance < transaccion.monto)
        return reject("saldo insuficiente para ejecutar transaccion");
      transaccionModel.updateOne(transId, data, result);
    }

    /**
     * @param {Object} error
     * @param {Transaccion} result
     */
    function result(error, result) {
      if (error) return reject(error.message);
      resolve(transaccion);
    }
  });
}
/**
 * @param {Transaccion} transaccion
 * @param {Usuario} usuario
 */
function cancelar(transaccion) {
  return new Promise((resolve, reject) => {
    if (transaccion.procesada == true)
      return reject(`transaccion procesada previamente`);
    if (transaccion.cancelada == true)
      return reject(`transaccion cancelada previamente`);
    transaccionModel.updateOne(
      { _id: transaccion._id },
      { cancelada: true },
      (error, result) => {
        if (error) return reject(error.message);
        resolve(result);
      }
    );
  });
}
//#endregion

module.exports = {
  debitar: debitar,
  acreditar: acreditar,
  /**
   * @param {Usuario} usuario
   * @param {Saldo} saldo
   */
  rollback(usuario, saldo) {
    let descripcion = `DEVOLUCION: ${saldo.descripcion}`;
    if (saldo.monto < 0) acreditar(usuario, descripcion, saldo.monto);
    else debitar(usuario, descripcion, saldo.monto);
  },
  /**
   * @param {String} usuarioId
   * @returns {Promise<Saldo>}
   */
  async ultimoSaldo(usuarioId) {
    return await ultimoSaldo(usuarioId);
  },
  buscar: {
    async id(saldoId) {
      return await saldoModel.findById(saldoId).lean();
    },
    async usuario(usuarioId) {
      return await saldoModel.find({ usuario: usuarioId }).lean();
    },
    async balance() {
      return new Promise((resolve, reject) => {
        saldoModel.aggregate(
          [
            { $sort: { tiempo: 1 } },
            {
              $group: {
                _id: "$usuario",
                balance: { $last: "$balance" },
                tiempo: { $last: "$tiempo" },
                descripcion: { $last: "$descripcion" },
              },
            },
            {
              $lookup: {
                from: "usuarios",
                localField: "_id",
                foreignField: "_id",
                as: "usuarios",
              },
            },
            {
              $replaceRoot: {
                newRoot: {
                  $mergeObjects: [{ $arrayElemAt: ["$usuarios", 0] }, "$$ROOT"],
                },
              },
            },
            {
              $project: {
                _id: 1,
                nombre: 1,
                jerarquia: 1,
                usuario: 1,
                balance: 1,
                tiempo: 1,
                descripcion: 1,
                moneda: 1,
              },
            },
          ],
          (error, saldos) => {
            if (error) return reject(error.message);
            resolve(saldos);
          }
        );
      });
    },
    /**
     * TODO: duplicado de saldoRepo.balance, verificar cual es mas optimo
     * @param {String} usuarioId
     */
    hijos(usuarioId) {
      return new Promise((resolve, reject) => {
        usuarioModel.aggregate(
          [
            { $match: { jerarquia: ObjectId(usuarioId) } },
            {
              $lookup: {
                from: "saldos",
                foreignField: "usuario",
                localField: "_id",
                as: "saldo",
              },
            },
            {
              $project: {
                nombre: 1,
                moneda: 1,
                saldo: { $arrayElemAt: ["$saldo", -1] },
              },
            },
            { $match: { saldo: { $exists: 1 } } },
            {
              $project: {
                moneda: 1,
                saldo: "$saldo.balance",
                tiempo: "$saldo.tiempo",
                nombre: 1,
              },
            },
          ],
          (error, result) => {
            if (error) return reject(error.message);
            resolve(result);
          }
        );
      });
    },
  },
  transaccion: {
    recarga,
    retiro,
    procesar,
    cancelar,
    buscar: {
      id: transaccion_porId,
      historia(usuarioId, tipo, limite, procesada) {
        return new Promise((resolve, reject) => {
          let condicion = { usuario: usuarioId, tipo };
          if (procesada > -1) condicion.procesada = Boolean(procesada);
          transaccionModel
            .find(condicion, (error, transacciones) => {
              if (error) return reject(error.message);
              resolve(transacciones);
            })
            .populate("metodo", "entidad")
            .limit(limite)
            .sort({ tiempo: -1 })
            .lean();
        });
      },
      /**
       *
       * @param {String} usuarioId
       * @param {String} tipo
       * @param {Number} limite
       * @param {Boolean} procesada
       * @returns {Promise<Transaccion[]>}
       */
      historia_padre(usuarioId, tipo, limite, procesada) {
        return new Promise((resolve, reject) => {
          let condicion = { jerarquia: usuarioId, tipo, cancelada: false };
          if (procesada > -1) condicion.procesada = Boolean(procesada);
          transaccionModel
            .find(condicion, (error, transacciones) => {
              if (error) return reject(error.message);
              resolve(transacciones);
            })
            .populate("metodo", "entidad direccion meta")
            .populate("usuario", "nombre usuario")
            .limit(limite)
            .sort({ tiempo: -1 })
            .lean();
        });
      },
    },
  },
  metodo_pago: {
    buscar: {
      /**
       * @param {String} metodoId
       * @returns {Promise<MetodoPago>}
       */
      async id(metodoId) {
        return await metodo_pagoModel.findById(metodoId).lean();
      },
      /**
       * @param {String} usuarioId
       * @param {String} moneda
       * @returns {Promise<MetodoPago>}
       */
      async usuario(usuarioId, moneda) {
        let condicion = { usuario: usuarioId };
        if (moneda) condicion.moneda = moneda;
        return await metodo_pagoModel.find(condicion).lean();
      },
      /**
       * @param {String} usuarioId
       * @param {Boolean} verificado
       * @returns {Promise<MetodoPago[]>}
       */
      async verificados(usuarioId, verificado) {
        return await metodo_pagoModel
          .find({ usuario: usuarioId, verificado })
          .lean();
      },
      /**
       * @returns {Promise<MetodoPago[]>}
       */
      async todos() {
        return await metodo_pagoModel.find().lean();
      },
    },
    /**
     * @param {Usuario} usuario
     * @param {String} entidad
     * @param {String} direccion
     * @param {String} moneda
     * @param {String} meta
     * @returns {Promise<MetodoPago>}
     */
    nuevo(usuario, entidad, direccion, moneda, meta) {
      return new Promise((resolve, reject) => {
        new metodo_pagoModel({
          usuario: usuario._id,
          entidad,
          direccion,
          moneda,
          meta,
        }).save((error, metodo) => {
          if (error) return reject(error.message);
          resolve(metodo);
        });
      });
    },
    /**
     * @param {String} metodoId
     * @param {String} usuarioId
     */
    remover(metodoId, usuarioId) {
      return new Promise((resolve, reject) => {
        metodo_pagoModel.deleteOne(
          { _id: metodoId, usuario: usuarioId },
          (error, result) => {
            if (error) return reject(error.message);
            resolve(result);
          }
        );
      });
    },
    editar(metodoId, campos) {
      //TODO validar que solo el mismo usuario pueda editar su metodo de pago
      campos.verificado = false;
      return new Promise((resolve, reject) => {
        metodo_pagoModel.updateOne(
          { _id: metodoId },
          campos,
          (error, result) => {
            console.log(metodoId, campos, result);
            if (error) return reject(error.message);
            resolve(result);
          }
        );
      });
    },
  },
};
