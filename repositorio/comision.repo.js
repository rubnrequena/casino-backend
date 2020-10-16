const comisionModel = require("_modelos/comision.model");
const Comision = require("../dto/comision.dto");

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
   * @param {String} comisionId
   * @param {Number} comision
   */
  modificar(comisionId, comision) {
    return new Promise((resolve, reject) => {
      const hoy = new Date();
      comisionModel.updateOne(
        { _id: comisionId, comision, modificado: hoy },
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
        comisionModel.findById(comisionModel, (error, comision) => {
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
      let condicion = { usuario: usuarioId };
      return buscar(condicion);
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
