const operadoraModel = require("_modelos/operadora-model");
const enlace_operadoraModel = require("_modelos/enlace_operadora-model");

const Operadora = require("../dto/operadora-dto");
const EnlaceOperadora = require("../dto/enlace-operadora-dto");
const operadorModel = require("_modelos/operador-model");
const mongoose = require("mongoose");
const numerosModel = require("_modelos/numeros-model");
const Numero = require("../dto/numero-dto");
const ObjectId = mongoose.Types.ObjectId;

module.exports = {
  /** JSDoc
   * @param {String} nombre
   * @param {String} tipo
   * @param {Number} paga
   * @param {Array<String>} sorteos
   * @returns {Promise<Operadora>}
   */
  guardar(nombre, tipo, paga, sorteos, numeros) {
    return new Promise((resolve, reject) => {
      new operadoraModel({
        nombre,
        tipo,
        paga,
        sorteos,
        numeros,
      }).save((err, operadora) => {
        if (err) return reject(err.message);
        resolve(operadora);
      });
    });
  },
  /** JSDoc
   * @param {String} operadoraId
   * @param {Boolean=} lean
   * @returns {Promise<Operadora>}
   */
  async porId(operadoraId, lean = true) {
    if (lean) return await operadoraModel.findById(operadoraId).lean();
    return await operadoraModel.findById(operadoraId);
  },
  /** JSDoc
   * @param {String} nombreOperadora
   * @param {Boolean=} lean
   * @returns {Promise<Operadora>}
   */
  async porNombre(nombreOperadora, lean = true) {
    const condicion = {
      nombre: nombreOperadora,
    };
    if (lean) return await operadoraModel.find(condicion).lean();
    return await operadoraModel.find(condicion);
  },
  /** JSDoc
   * @param {String} tipoOperadora
   * @param {Boolean=} lean
   * @returns {Promise<Operadora>}
   */
  async porTipo(tipoOperadora, lean = true) {
    const condicion = {
      tipo: tipoOperadora,
    };
    if (lean) return await operadoraModel.find(condicion).lean();
    return await operadoraModel.find(condicion);
  },
  /** Retorna un nuevo enlace entre el usuario y la operadora
   * @param {String} usuariosId
   * @param {String} operadoraId
   * @param {Boolean} mostrar
   * @param {Number} nivel
   * @returns {Promise<EnlaceOperadora>} el nuevo enlace
   */
  enlaceNuevo(usuariosId, operadoraId, mostrar, nivel) {
    return new Promise((resolve, reject) => {
      new enlace_operadoraModel({
        usuario: usuariosId,
        operadora: operadoraId,
        mostrar,
        nivel,
      }).save((error, enlace) => {
        if (error) return reject(error.message);
        resolve(enlace);
      });
    });
  },
  enlaceRemover(usuarioId, enlaceId) {
    return new Promise((resolve, reject) => {
      enlace_operadoraModel.deleteOne(
        { _id: enlaceId, usuario: usuarioId },
        (error, result) => {
          if (error) return reject(error.message);
          resolve(result);
        }
      );
    });
  },
  /**
   * @param {String} usuarioId
   * @param {String} enlaceId
   * @param {Boolean} activo
   */
  enlaceActivar(usuarioId, enlaceId, activo) {
    return new Promise((resolve, reject) => {
      enlace_operadoraModel.updateOne(
        { _id: enlaceId, usuario: usuarioId },
        { mostrar: activo },
        (err) => {
          if (err) return reject(err);
          resolve({ ok: 1 });
        }
      );
    });
  },
  buscar: {
    /**
     * @param {String} operadoraId
     * @returns {Promise<Operadora>}
     */
    async id(operadoraId) {
      return await operadoraModel.findById(operadoraId).lean();
    },
    /**
     * @returns {Promise<Operadora[]>}
     */
    async todas() {
      return await operadoraModel.find().lean();
    },
    /**
     * @returns {Promise<Operadora[]>}
     */
    async disponibles() {
      return await operadoraModel.find({}).lean();
    },
    /**
     * @param {String} usuarioId
     * @returns {Promise<EnlaceOperadora[]>}
     */
    async enlacesUsuario(usuarioId) {
      return new Promise((resolve, reject) => {
        enlace_operadoraModel.aggregate(
          [
            { $addFields: { usuario: { $arrayElemAt: ["$usuario", -1] } } },
            { $match: { usuario: ObjectId(usuarioId) } },
            {
              $lookup: {
                from: "operadoras",
                foreignField: "_id",
                localField: "operadora",
                as: "operadora",
              },
            },
            { $addFields: { operadora: { $arrayElemAt: ["$operadora", 0] } } },
            {
              $project: {
                "operadora.sorteos": 0,
                "operadora.tipo": 0,
                "operadora.paga": 0,
                "operadora.__v": 0,
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
    /**
     * @param {String} operadoraId
     * @returns {Promise<EnlaceOperadora[]>}
     */
    async enlacesOperadora(operadoraId) {
      return await enlace_operadoraModel
        .find({
          operadora: operadoraId,
        })
        .populate("usuario", "nombre")
        .lean();
    },
    async operador(usuarioId) {
      return await operadorModel.find({ usuario: usuarioId }).lean();
    },
  },
  numeros: {
    buscar: {
      /** Listar todos los numeros
       * @returns {Promise<Numero[]>}
       */
      async todos() {
        return await numerosModel.find().lean();
      },
      /** Buscar Numero por ID
       * @param {String} numeroId
       * @returns {Promise<Numero>}
       */
      async id(numeroId) {
        return await numerosModel.findById(numeroId).lean();
      },
    },
    /** Registrar numeros
     * @param {String} nombre
     * @param {Array} numeros
     * @returns {Promise<Numero>}
     */
    nuevo(nombre, numeros) {
      return new Promise((resolve, reject) => {
        new Numero({ nombre, numeros }, (error, numero) => {
          if (error) return reject(error.message);
          resolve(numero);
        });
      });
    },
  },
};
