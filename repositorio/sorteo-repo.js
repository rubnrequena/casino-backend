const mongoose = require("mongoose");
const sorteoModel = require("_modelos/sorteo-model");
const Sorteo = require("../dto/sorteo-dto");
const operadoraRepo = require("./operadora-repo");
const { parseDateString } = require("../utils/date-util");
const enlace_operadoraModel = require("_modelos/enlace_operadora-model");
const EnlaceOperadora = require("../dto/enlace-operadora-dto");
const redisRepo = require("./redis-repo");
const Usuario = require("../dto/usuario-dto");
const operadoraModel = require("_modelos/operadora-model");
const dateUtil = require("../utils/date-util");
const numerosModel = require("_modelos/numeros-model");
const numeroRepo = require("./numero-repo");

module.exports = {
  /** JSDoc
   * @param {String} fecha
   * @param {String} operadoraId
   * @returns {Promise<Sorteo>}
   */
  registrar(fecha, operadoraId) {
    return new Promise(async (resolve, reject) => {
      const operadora = await operadoraRepo.porId(operadoraId);
      if (!operadora) return reject(`operadora "${operadoraId}" no existe`);
      const sorteosLen = operadora.sorteos.length;
      let sorteos = [];
      for (let i = 0; i < sorteosLen; i++) {
        const horario = operadora.sorteos[i];
        sorteos.push({
          descripcion: `${operadora.nombre} ${horario}`,
          fecha,
          cierra: parseDateString(fecha, horario),
          abierta: true,
          operadora: operadoraId,
        });
      }
      sorteoModel.insertMany(sorteos, (error, sorteos) => {
        if (error) return reject(error.message);
        resolve(sorteos);
      });
    });
  },
  editar(sorteoId, campos) {},
  remover(sorteoId) {},
  cerrar(sorteoId) {
    return new Promise((resolve, reject) => {
      sorteoModel.updateOne(
        {
          _id: sorteoId,
        },
        {
          abierta: false,
        },
        (error) => {
          if (error) return reject(error.message);
          resolve();
        }
      );
    });
  },
  abrir(sorteoId) {
    return new Promise(async (resolve, reject) => {
      /** @type {Sorteo} */
      const sorteo = await sorteoModel.findById(sorteoId);
      const now = new Date();
      if (now > sorteo.cierra)
        return reject("imposible abrir sorteo, hora de cierre excedido");
      sorteo.abierta = true;
      sorteo.save((error) => {
        if (error) return reject(error.message);
        resolve();
      });
    });
  },
  reiniciar(sorteoId) {
    return new Promise((resolve, reject) => {
      sorteoModel.updateOne(
        {
          _id: sorteoId,
        },
        {
          ganador: null,
        },
        (error, result) => {
          if (error) return reject(error.message);
          resolve(result);
        }
      );
    });
  },
  buscar: {
    /**
     * @param {String} sorteoId
     * @returns {Sorteo}
     */
    async id(sorteoId, campos) {
      return await sorteoModel.findById(sorteoId, campos).lean();
    },
    /**JSDoc
     * @param {Date} desde
     * @param {Date} hasta
     * @param {String} operadora
     * @param {String} campos
     * @returns {Promise<Sorteo[]>}
     */
    async fecha(desde, hasta, operadora, campos) {
      let filtro = {
        fecha: {
          $gte: desde,
          $lte: hasta,
        },
      };
      var populate;
      if (operadora) {
        filtro.operadora = operadora;
        populate = "";
      } else populate = "operadora";
      const sorteos = await sorteoModel
        .find(filtro, "cierra descripcion fecha operadora ganador abierta")
        .populate(populate, "nombre")
        .lean();
      return sorteos;
    },
    /**
     * @param {Usuario} usuario
     * @returns {EnlaceOperadora[]}
     */
    disponibles(usuario) {
      return new Promise((resolve, reject) => {
        let jerarquias = usuario.jerarquia.map((jerarquia) => ({
          usuario: jerarquia,
        }));
        enlace_operadoraModel
          .find(null, "operadora mostrar nivel")
          .or(jerarquias)
          .sort({ nivel: 1 })
          .then((sorteos) => resolve(sorteos))
          .catch((error) => reject(error));
      });
    },
    /**
     *
     * @param {[]} operadoras
     * @param {String} fecha
     * @returns {Promise<Sorteo>}
     */
    async operadoras(operadoras, fecha) {
      let ids = operadoras.map((operadora) => ({ _id: operadora.operadora }));
      const sorteos = await sorteoModel
        .find(null, "cierra descripcion operadora")
        .or(operadoras)
        .and({ fecha })
        .lean();
      const _operadoras = await operadoraModel
        .find(null, "nombre paga sorteos numeros")
        .or(ids)
        .lean();
      ids = _operadoras.map((operadora) => operadora.numeros);
      const numeros = await numeroRepo.numeros_operadoras(ids);
      return {
        sorteos,
        operadoras: _operadoras,
        numeros: numeros,
      };
    },
    sinGanador(operadora, fecha) {
      return new Promise((resolve, reject) => {
        sorteoModel
          .find(
            { operadora, fecha, cierra: { $lte: new Date() }, ganador: null },
            (error, sorteos) => {
              if (error) return reject(error.message);
              resolve(sorteos);
            }
          )
          .lean();
      });
    },
    conGanador() {
      return new Promise((resolve, reject) => {
        const hoy = dateUtil.formatDate(new Date(), "YYYY-MM-DD");
        sorteoModel
          .find(
            { cierra: { $lte: hoy }, ganador: { $ne: null } },
            "descripcion ganador",
            (error, sorteos) => {
              if (error) return reject(error.message);
              resolve(sorteos);
            }
          )
          .lean();
      });
    },
    jaula(operadoraId) {
      return new Promise((resolve, reject) => {
        sorteoModel.aggregate(
          [
            {
              $match: {
                operadora: ObjectId(operadoraId),
                ganador: { $ne: null },
              },
            },
            {
              $group: {
                _id: "$ganador",
                fecha: { $last: "$fecha" },
                veces: { $sum: 1 },
              },
            },
            {
              $addFields: {
                tiempo: { $subtract: [{ $toDate: "$fecha" }, "$$NOW"] },
              },
            },
            {
              $project: {
                veces: 1,
                fecha: 1,
                tiempo: {
                  $abs: { $trunc: [{ $divide: ["$tiempo", 86400000] }, 0] },
                },
              },
            },
          ],
          (error, numeros) => {
            if (error) return reject(error.message);
            resolve(numeros);
          }
        );
      });
    },
  },
};

function serializar(sorteo) {
  sorteo.cierra = new Date(sorteo.cierra);
  sorteo.fecha = new Date(sorteo.fecha);
  sorteo.operadora = new mongoose.Types.ObjectId(sorteo.operadora);
  sorteo._id = new mongoose.Types.ObjectId(sorteo.operadora);
  return sorteo;
}
