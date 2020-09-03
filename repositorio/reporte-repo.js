const { mongo } = require("mongoose");
const reporteModel = require("_modelos/reporte-model");
const Reporte = require("../dto/reporte-dto");
const mongoose = require("mongoose");
const Operadora = require("../dto/operadora-dto");
const ObjectId = mongoose.Types.ObjectId;

function nuevo() {}

function reiniciar(sorteoId) {
  return new Promise((resolve, reject) => {
    reporteModel.deleteMany(
      {
        sorteo: sorteoId,
      },
      (error, result) => {
        if (error) return reject(error.message);
        resolve(result);
      }
    );
  });
}

/**
 * @param {String} taquilaId
 * @returns {Promise<Reporte[]>}
 */
async function taquilla(usuarioId, filtros) {
  return await reporteModel
    .find(
      {
        usuario: usuarioId,
        ...filtros,
      },
      "-comision.agencia -comision.grupo -comision.banca -comision.comercial -participacion"
    )
    .lean();
}

/**
 * @param {String} usuarioId
 * @returns {Promise<Reporte[]>}
 */
async function agencia(usuarioId, filtros) {
  return await reporteModel
    .find(
      {
        jerarquia: usuarioId,
        ...filtros,
      },
      "-comision.grupo -comision.banca -comision.comercial -participacion.grupo -participacion.banca -participacion.comercial"
    )
    .lean();
}
/**
 * @param {String} usuarioId
 * @returns {Promise<Reporte[]>}
 */
async function grupo(usuarioId, filtros) {
  return await reporteModel
    .find(
      {
        jerarquia: usuarioId,
        ...filtros,
      },
      "-comision.banca -comision.comercial -participacion.banca -participacion.comercial"
    )
    .lean();
}
/**
 * @param {String} usuarioId
 * @returns {Promise<Reporte[]>}
 */
async function banca(usuarioId, filtros) {
  return await reporteModel
    .find(
      {
        jerarquia: usuarioId,
        ...filtros,
      },
      "-comision.comercial -participacion.comercial"
    )
    .lean();
}
/**
 * @param {String} usuarioId
 * @returns {Promise<Reporte[]>}
 */
async function comercial(usuarioId, filtros) {
  return await reporteModel
    .find({
      jerarquia: usuarioId,
      ...filtros,
    })
    .lean();
}
/**
 *
 * @param {String} usuarioId
 * @param {Object=} filtros
 * @returns {Reporte[]}
 */
async function admin(usuarioId, filtros) {
  return await reporteModel
    .find({
      jerarquia: usuarioId,
      ...filtros,
    })
    .lean();
}

module.exports = {
  nuevo,
  reiniciar,
  buscar: {
    /**
     *
     * @param {String} usuarioId
     * @param {Operadora[]} operadoras
     * @param {String} desde
     * @param {String} hasta
     */
    usuario(usuarioId, operadoras, desde, hasta) {
      desde = new Date(desde);
      hasta = new Date(hasta);
      hasta.setHours(23, 59, 59);
      return new Promise((resolve, reject) => {
        operadoras = operadoras.map((operadora) => operadora.operadora._id);
        reporteModel.aggregate(
          [
            {
              $match: {
                jerarquia: ObjectId(usuarioId),
                fecha: { $gte: desde, $lte: hasta },
                operadora: { $in: operadoras },
              },
            },
            {
              $addFields: {
                hijo: { $arrayElemAt: ["$jerarquia", 1] },
                subtotal: {
                  $subtract: [
                    "$venta",
                    {
                      $sum: [
                        "$premio",
                        { $multiply: ["$venta", "$comision.agente"] },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $group: {
                _id: "$hijo",
                venta: { $sum: "$venta" },
                premio: { $sum: "$premio" },
                tickets: { $sum: "$numTickets" },
                subtotal: { $sum: "$subtotal" },
                comision: {
                  $sum: { $multiply: ["$venta", "$comision.agente"] },
                },
                participacion: {
                  $sum: { $multiply: ["$subtotal", "$participacion.agente"] },
                },
              },
            },
            {
              $addFields: {
                total: { $subtract: ["$subtotal", "$participacion"] },
              },
            },
            {
              $lookup: {
                from: "usuarios",
                localField: "_id",
                foreignField: "_id",
                as: "usuario",
              },
            },
            { $addFields: { usuario: { $arrayElemAt: ["$usuario", 0] } } },
            {
              $project: {
                venta: 1,
                premio: 1,
                tickets: 1,
                comision: 1,
                subtotal: 1,
                participacion: 1,
                total: 1,
                "usuario.nombre": 1,
                "usuario._id": 1,
                "usuario.codigo": 1,
              },
            },
            { $sort: { "usuario.codigo": 1 } },
          ],
          (error, reportes) => {
            if (error) return reject(error.message);
            resolve(reportes);
          }
        );
      });
    },
    operadoras(usuarioId, operadoras, desde, hasta) {
      desde = new Date(desde);
      hasta = new Date(hasta);
      hasta.setHours(23, 59, 59);
      return new Promise((resolve, reject) => {
        operadoras = operadoras.map((operadora) => operadora.operadora._id);
        reporteModel.aggregate(
          [
            {
              $match: {
                jerarquia: ObjectId(usuarioId),
                fecha: { $gte: desde, $lte: hasta },
                operadora: { $in: operadoras },
              },
            },
            {
              $addFields: {
                subtotal: {
                  $subtract: [
                    "$venta",
                    {
                      $sum: [
                        "$premio",
                        { $multiply: ["$venta", "$comision.agente"] },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $group: {
                _id: "$operadora",
                venta: { $sum: "$venta" },
                premio: { $sum: "$premio" },
                tickets: { $sum: "$numTickets" },
                subtotal: { $sum: "$subtotal" },
                comision: {
                  $sum: { $multiply: ["$venta", "$comision.agente"] },
                },
                participacion: {
                  $sum: { $multiply: ["$subtotal", "$participacion.agente"] },
                },
              },
            },
            {
              $addFields: {
                total: { $subtract: ["$subtotal", "$participacion"] },
              },
            },
            {
              $lookup: {
                from: "operadoras",
                localField: "_id",
                foreignField: "_id",
                as: "operadora",
              },
            },
            { $addFields: { operadora: { $arrayElemAt: ["$operadora", 0] } } },
            {
              $project: {
                venta: 1,
                premio: 1,
                tickets: 1,
                comision: 1,
                subtotal: 1,
                participacion: 1,
                total: 1,
                "operadora.nombre": 1,
                "operadora.tipo": 1,
                "operadora.paga": 1,
              },
            },
            { $sort: { "operadora.nombre": 1 } },
          ],
          (error, reportes) => {
            if (error) return reject(error.message);
            resolve(reportes);
          }
        );
      });
    },
    negativos: {
      usuario(usuarioId, operadoras, desde, hasta) {
        desde = new Date(desde);
        hasta = new Date(hasta);
        hasta.setHours(23, 59, 59);
        return new Promise((resolve, reject) => {
          operadoras = operadoras.map((operadora) => operadora.operadora._id);
          reporteModel.aggregate(
            [
              {
                $match: {
                  jerarquia: ObjectId(usuarioId),
                  fecha: { $gte: desde, $lte: hasta },
                  operadora: { $in: operadoras },
                },
              },
              {
                $addFields: {
                  hijo: { $arrayElemAt: ["$jerarquia", 1] },
                  subtotal: {
                    $subtract: [
                      "$venta",
                      {
                        $sum: [
                          "$premio",
                          { $multiply: ["$venta", "$comision.agente"] },
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: "$hijo",
                  venta: { $sum: "$venta" },
                  premio: { $sum: "$premio" },
                  tickets: { $sum: "$numTickets" },
                  subtotal: { $sum: "$subtotal" },
                  comision: {
                    $sum: { $multiply: ["$venta", "$comision.agente"] },
                  },
                  participacion: {
                    $sum: { $multiply: ["$subtotal", "$participacion.agente"] },
                  },
                },
              },
              {
                $addFields: {
                  total: { $subtract: ["$subtotal", "$participacion"] },
                },
              },
              {
                $lookup: {
                  from: "usuarios",
                  localField: "_id",
                  foreignField: "_id",
                  as: "usuario",
                },
              },
              { $addFields: { usuario: { $arrayElemAt: ["$usuario", 0] } } },
              {
                $project: {
                  venta: 1,
                  premio: 1,
                  tickets: 1,
                  comision: 1,
                  subtotal: 1,
                  participacion: 1,
                  total: 1,
                  "usuario.nombre": 1,
                  "usuario._id": 1,
                  "usuario.codigo": 1,
                },
              },
              { $match: { total: { $lt: 0 } } },
            ],
            (error, reportes) => {
              if (error) return reject(error.message);
              resolve(reportes);
            }
          );
        });
      },
    },
  },
};
