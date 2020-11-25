const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId

const Comision = require("../dto/comision.dto");
const comisionModel = require("_modelos/comision.model");


function registrar(doc) {
  return new Promise((resolve, reject) => {
    const hoy = new Date();
    doc.creado = hoy;
    doc.modificado = hoy;
    new comisionModel(doc).save((error, comision) => {
      if (error) return reject(error.message);
      resolve(comision);
    });
  });
}

/**
 * @param {Object} condicion
 * @returns {Promise<Comision[]>}
 */
function buscar(condicion) {
  return new Promise((resolve, reject) => {
    comisionModel
      .find(condicion, (error, comisiones) => {
        if (error) return reject(error.message);
        resolve(comisiones);
      })
      .lean();
  });
}


module.exports = {
  /**
   *
   * @param {String} usuarioId
   * @param {String} operadoraId
   * @param {Number} comision
   * @param {Number} participacion
   * @param {Number} utilidad
   * @return {Promise<Comision>}
   */
  registrar(usuarioId, operadoraId, comision, participacion, utilidad) {
    return new Promise((resolve, reject) => {
      new comisionModel({
        usuario: usuarioId,
        operadora: operadoraId,
        comision,
        participacion,
        utilidad,
      }).save((error, comision) => {
        if (error) return reject(error.message);
        resolve(comision);
      });
    });
  },
  /**
   * @param {String} usuarioId
   * @param {String} comisionId
   * @param {Comision} comision
   */
  modificar(usuarioId, comisionId, comision) {
    return new Promise((resolve, reject) => {
      comisionModel.updateOne(
        { _id: comisionId, usuario: usuarioId }, comision,
        (error, result) => {
          if (error) return reject(error.message);
          resolve(result);
        }
      );
    });
  },
  /**
   * @param {String} comisionId
   */
  remover(comisionId) {
    return new Promise((resolve, reject) => {
      comisionModel.remove({ _id: comisionId }, (error, result) => {
        if (error) return reject(error.message);
        resolve(result);
      });
    });
  },
  buscar: {
    /**
     * @param {String} comisionId
     * @returns {Promise<Comision>}
     */
    id(comisionId) {
      return new Promise((resolve, reject) => {
        comisionModel.findById(comisionId, (error, comision) => {
          if (error) return reject(error.message);
          resolve(comision);
        });
      });
    },
    /**
     * @param {String} usuarioId
     * @returns {Promise<Comision[]>}
     */
    usuario(usuarioId) {
      return new Promise((resolve, reject) => {
        comisionModel.aggregate([
          { $match: { usuario: ObjectId(usuarioId) } },
          {
            $lookup: {
              from: "operadoras",
              foreignField: "_id",
              localField: "operadora",
              as: "operadora"
            }
          },
          { $addFields: { operadora: { $arrayElemAt: ["$operadora", 0] } } },
          {
            $project: {
              comision: 1,
              participacion: 1,
              utilidad: 1,
              operadora: "$operadora.nombre"
            }
          }
        ], (error, comisiones) => {
          if (error) return reject(error.message)
          resolve(comisiones)
        })
      });
    },
    /**
     * @param {String} operadoraId
     * @returns {Promise<Comision[]>}
     */
    operadora(operadoraId) {
      let condicion = { operadora: operadoraId };
      return buscar(condicion);
    },
  },
};