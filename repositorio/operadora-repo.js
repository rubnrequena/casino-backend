const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const operadoraModel = require("_modelos/operadora-model");
const enlace_operadoraModel = require("_modelos/enlace_operadora-model");
const operadorModel = require("_modelos/operador-model");
const numerosModel = require("_modelos/numeros-model");

const Operadora = require("../dto/operadora-dto");
const EnlaceOperadora = require("../dto/enlace-operadora-dto");
const PagoOperadoras = require("../dto/operadora_paga_usuario-dto");
const Numero = require("../dto/numero-dto");
const grupo_pagoModel = require("_modelos/grupo_pago-model");
const GrupoPago = require("../dto/grupo_pago-model");
const operadora_pagaModel = require("_modelos/operadora_paga-model");
const Usuario = require("../dto/usuario-dto");

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
  /**
   * @param {String} usuarioId
   * @returns {Promise<PagoOperadoras[]>}
   */
  paga(grupoId) {
    grupoId = grupoId.toString();
    return new Promise((resolve, reject) => {
      operadoraModel.aggregate(
        [
          {
            $lookup: {
              from: "operadoras_paga",
              let: {
                operadora: "$_id",
                grupo: ObjectId(grupoId),
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$grupo", "$$grupo"] },
                        { $eq: ["$operadora", "$$operadora"] },
                      ],
                    },
                  },
                },
              ],
              as: "pagos",
            },
          },
          {
            $project: {
              nombre: 1,
              paga: 1,
              usuarioPaga: { $arrayElemAt: ["$pagos.monto", 0] },
            },
          },
        ],
        (error, result) => {
          if (error) return reject(error);
          return resolve(result);
        }
      );
    });
  },
  pagos: {
    /**
     * @param {String} operadora
     * @param {String} grupo
     * @param {Number} monto
     */
    nuevo(operadora, grupo, monto) {
      return new Promise((resolve, reject) => {
        new operadora_pagaModel({
          operadora,
          grupo,
          monto,
        }).save((err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
    },
  },
  grupos: {
    buscar: {
      /**
       * @param {String} grupoId
       * @returns {Promise<GrupoPago>}
       */
      id(grupoId) {
        return new Promise((resolve, reject) => {
          grupo_pagoModel.findById(grupoId, (error, grupo) => {
            if (error) return reject(error.message);
            resolve(grupo);
          });
        });
      },
      /**
       * @returns {Promise<GrupoPago[]>}
       */
      todos() {
        return new Promise((resolve, reject) => {
          grupo_pagoModel.find(null, (error, grupos) => {
            if (error) return reject(error.message);
            resolve(grupos);
          });
        });
      },
      /**
       * @param {String} usuarioId
       * @returns {Promise<GrupoPago[]>}
       */
      usuario(usuarioId) {
        return new Promise((resolve, reject) => {
          grupo_pagoModel.find({ usuario: usuarioId }, (error, grupos) => {
            if (error) return reject(error.message);
            resolve(grupos);
          });
        });
      },
    },
    /**
     *
     * @param {String} nombre
     * @param {String} descripcion
     * @param {String} usuario
     * @returns {Promise<GrupoPago[]>}
     */
    nuevo(nombre, descripcion, usuario) {
      return new Promise((resolve, reject) => {
        new grupo_pagoModel({
          nombre,
          descripcion,
          usuario,
        }).save((error, grupo) => {
          if (error) return reject(error.message);
          resolve(grupo);
        });
      });
    },
    /**
     * @param {String} grupoId
     * @param {String} usuarioId
     */
    remover(grupoId, usuarioId) {
      return new Promise((resolve, reject) => {
        operadoraModel.deleteOne(
          { _id: grupoId, usuario: usuarioId },
          (error, result) => {
            if (error) return reject(error.message);
            resolve(result);
          }
        );
      });
    },
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
     * @param {Usuario} usuario
     * @returns {Promise<EnlaceOperadora[]>}
     */
    async enlacesUsuario(usuario) {
      return new Promise((resolve, reject) => {
        const jerarquia = [...usuario.jerarquia, usuario._id].map((id) =>
          ObjectId(id.toString())
        );
        enlace_operadoraModel.aggregate(
          [
            { $match: { usuario: { $in: jerarquia } } },
            { $sort: { nivel: 1 } },
            {
              $group: {
                _id: "$operadora",
                mostrar: { $first: "$mostrar" },
                operadora: { $first: "$operadora" },
                nivel: { $first: "$nivel" },
              },
            },
            { $match: { mostrar: true } },
            { $project: { operadora: 1, nivel: 1 } },
          ],
          (error, result) => {
            if (error) return reject(error.message);
            resolve(result);
          }
        );
      });
    },

    /**
     * @param {String[]} jerarquia
     * @returns {Promise<EnlaceOperadora[]>}
     */
    async enlacesUsuarioFull(jerarquia) {
      return new Promise((resolve, reject) => {
        jerarquia = jerarquia.map((u) => ObjectId(u.toString()));
        enlace_operadoraModel.aggregate(
          [
            { $match: { usuario: { $in: jerarquia } } },
            { $sort: { nivel: 1 } },
            { $sort: { nivel: 1 } },
            {
              $group: {
                _id: "$operadora",
                enlace: { $first: "$_id" },
                mostrar: { $first: "$mostrar" },
                operadora: { $first: "$operadora" },
                nivel: { $first: "$nivel" },
                creado: { $first: "$creado" },
                usuario: { $first: "$usuario" },
              },
            },
            {
              $lookup: {
                from: "operadoras",
                foreignField: "_id",
                localField: "operadora",
                as: "operadora",
              },
            },
            {
              $project: {
                mostrar: 1,
                nivel: 1,
                creado: 1,
                usuario: 1,
                enlace: 1,
                operadora: { $arrayElemAt: ["$operadora.nombre", 0] },
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
