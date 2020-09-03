const comisionModel = require("_modelos/comision.model");
const Comision = require("../dto/comision.dto");

module.exports = {
  /**
   * @param {Number} comision
   * @param {String} usuarioId
   * @param {String} operadoraId
   * @returns {Promise<Comision>}
   */
  registrar_comision(comision, usuarioId, operadoraId) {
    return registrar({
      tipo: COMISION,
      comision,
      usuario: usuarioId,
      operadora: operadoraId,
    });
  },
  /**
   * @param {Number} comision
   * @param {String} usuarioId
   * @param {String} operadoraId
   * @returns {Promise<Comision>}
   */
  registrar_participacion(usuarioId, comision, operadoraId) {
    return registrar({
      tipo: PARTICIPACION,
      comision,
      usuario: usuarioId,
      operadora: operadoraId,
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
     * @param {Number} tipo
     * @returns {Promise<Comision[]>}
     */
    usuario(usuarioId, tipo) {
      let condicion = { usuario: usuarioId };
      if (tipo > -1) condicion.tipo = tipo;
      return buscar(condicion);
    },
    /**
     * @param {String} operadoraId
     * @param {Number} tipo
     * @returns {Promise<Comision>}
     */
    operadora(operadoraId, tipo = -1) {
      let condicion = { operadora: operadoraId };
      if (tipo > -1) condicion.tipo = tipo;
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
    comisionModel.find(condicion, (error, comisiones) => {
      if (error) return reject(error.message);
      resolve(comisiones);
    });
  });
}
