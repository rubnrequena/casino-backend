const { mongo } = require("mongoose");
const reporteModel = require("_modelos/reporte-model");
const Reporte = require("../dto/reporte-dto");
const mongoose = require("mongoose");
const Operadora = require("../dto/operadora-dto");
const Usuario = require("../dto/usuario-dto");
const ObjectId = mongoose.Types.ObjectId;

function nuevo() {}

function reiniciar(sorteoId) {
  return new Promise((resolve, reject) => {
    reporteModel.deleteMany({ sorteo: sorteoId }, (error, result) => {
      if (error) return reject(error.message);
      resolve(result);
    });
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
const participacionMap = {
  master: {
    $cond: [
      `$participacion.${Usuario.MULTI}`,
      `$participacion.${Usuario.MULTI}`,
      `$participacion.${Usuario.AGENTE}`,
    ],
  },
  multi: `$participacion.${Usuario.BANCA}`,
  banca: `$participacion.${Usuario.GRUPO}`,
  grupo: `$participacion.${Usuario.AGENCIA}`,
  agencia: `$participacion.${Usuario.TAQUILLA}`,
  agente: `$participacion.${Usuario.ONLINE}`,
};
const comisionMap = {
  master: {
    $cond: [
      `$comision.${Usuario.MULTI}`,
      `$comision.${Usuario.MULTI}`,
      `$comision.${Usuario.AGENTE}`,
    ],
  },
  multi: `$comision.${Usuario.BANCA}`,
  banca: `$comision.${Usuario.GRUPO}`,
  grupo: `$comision.${Usuario.AGENCIA}`,
  agencia: `$comision.${Usuario.TAQUILLA}`,
  agente: `$comision.${Usuario.ONLINE}`,
};
const rolMap = {
  master: 1,
  agente: 2,
  online: 3,
  multi: 2,
  banca: 3,
  grupo: 4,
  agencia: 5,
};
/**
 *
 * @param {String} usuarioId
 * @param {String} rol
 * @param {Operadora[]} operadoras
 * @param {String} desde
 * @param {String} hasta
 */
function buscar_usuario(usuarioId, rol, operadoras, desde, hasta, moneda) {
  const comision = comisionMap[rol];
  const participacion = participacionMap[rol];
  const rolNivel = rolMap[rol];
  desde = new Date(desde);
  desde.setHours(0, 0, 0);
  hasta = new Date(hasta);
  hasta.setHours(23, 59, 59);
  return new Promise((resolve, reject) => {
    let match = {
      jerarquia: ObjectId(usuarioId),
      fecha: { $gte: desde, $lte: hasta },
      moneda,
    };
    if (operadoras) match.operadora = { $in: operadoras };
    reporteModel.aggregate(
      [
        { $match: match },
        {
          $addFields: {
            hijo: {
              $cond: [
                { $arrayElemAt: ["$jerarquia", rolNivel] },
                { $arrayElemAt: ["$jerarquia", rolNivel] },
                "$usuario",
              ],
            },
            subtotal: {
              $subtract: [
                "$venta",
                {
                  $sum: ["$premio", { $multiply: ["$venta", comision, 0.01] }],
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
              $sum: {
                $multiply: ["$venta", comision, 0.01],
              },
            },
            participacion: {
              $sum: {
                $multiply: ["$subtotal", participacion, 0.01],
              },
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
            "usuario.rol": 1,
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
}
/**
 *
 * @param {String} usuarioId
 * @param {String} rol
 * @param {Operadora[]} operadoras
 * @param {String} desde
 * @param {String} hasta
 */
function buscar_taquilla(usuarioId, rol, desde, hasta, moneda) {
  const comision = comisionMap[rol];
  const participacion = participacionMap[rol];
  const rolNivel = rolMap[rol];
  desde = new Date(desde);
  desde.setHours(0, 0, 0);
  hasta = new Date(hasta);
  hasta.setHours(23, 59, 59);
  return new Promise((resolve, reject) => {
    let match = {
      usuario: ObjectId(usuarioId),
      fecha: { $gte: desde, $lte: hasta },
      moneda,
    };
    reporteModel.aggregate(
      [
        {
          $match: match,
        },
        {
          $addFields: {
            subtotal: {
              $subtract: [
                "$venta",
                {
                  $sum: [
                    "$premio",
                    {
                      $multiply: ["$venta", comision, 0.01],
                    },
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
              $sum: {
                $multiply: ["$venta", comision, 0.01],
              },
            },
            participacion: {
              $sum: {
                $multiply: ["$subtotal", participacion, 0.01],
              },
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
            operadora: "$operadora.nombre",
          },
        },
        { $sort: { operadora: 1 } },
      ],
      (error, reportes) => {
        if (error) return reject(error.message);
        resolve(reportes);
      }
    );
  });
}
/**
 *
 * @param {String} usuarioId
 * @param {String} operadoras
 * @param {String} desde
 * @param {String} hasta
 * @returns {Reporte[]}
 */
function buscar_operadoras(usuarioId, rol, desde, hasta, moneda) {
  return new Promise((resolve, reject) => {
    const comision = comisionMap[rol];
    const participacion = participacionMap[rol];
    desde = new Date(desde);
    desde.setHours(0, 0, 0);
    hasta = new Date(hasta);
    hasta.setHours(23, 59, 59);
    let match = {
      jerarquia: ObjectId(usuarioId),
      fecha: { $gte: desde, $lte: hasta },
      moneda,
    };
    if (operadoras) match.operadora = { $in: operadoras };
    reporteModel.aggregate(
      [
        {
          $match: match,
        },
        {
          $addFields: {
            subtotal: {
              $subtract: [
                "$venta",
                {
                  $sum: [
                    "$premio",
                    {
                      $multiply: ["$venta", comision, 0.01],
                    },
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
              $sum: {
                $multiply: ["$venta", comision, 0.01],
              },
            },
            participacion: {
              $sum: {
                $multiply: ["$subtotal", participacion, 0.01],
              },
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
}
function buscar_loteria(rol, desde, hasta, moneda) {
  return new Promise((resolve, reject) => {
    const comision = comisionMap[rol];
    const participacion = participacionMap[rol];
    desde = new Date(desde);
    desde.setHours(0, 0, 0);
    hasta = new Date(hasta);
    hasta.setHours(23, 59, 59);

    reporteModel.aggregate(
      [
        {
          $match: {
            fecha: { $gte: desde, $lte: hasta },
            moneda,
          },
        },
        {
          $addFields: {
            hijo: { $arrayElemAt: ["$jerarquia", 1] },
            cm_banca: { $multiply: ["$venta", comision, 0.01] },
          },
        },
        {
          $addFields: {
            subtotal: {
              $subtract: ["$venta", { $sum: ["$premio", "$comision"] }],
            },
          },
        },
        {
          $addFields: {
            pt_banca: {
              $sum: { $multiply: ["$subtotal", participacion, 0.01] },
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
            cm_banca: { $sum: "$cm_banca" },
            pt_banca: { $sum: "$pt_banca" },
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
            "operadora.nombre": 1,
            "operadora.tipo": 1,
            "operadora.paga": 1,
            venta: 1,
            premio: 1,
            tickets: 1,
            subtotal: 1,
            cm_banca: 1,
            pt_banca: 1,
            pt_loteria: {
              $multiply: ["$subtotal", "$operadora.participacion", 0.01],
            },
            cm_master: { $multiply: ["$venta", "$operadora.comision", 0.01] },
          },
        },
        {
          $addFields: {
            pt_master: {
              $subtract: ["$subtotal", { $sum: ["$pt_banca", "$pt_loteria"] }],
            },
            bancas: { $sum: ["$cm_banca", "$pt_banca"] },
            master: { $sum: ["$cm_master", "$pt_master"] },
          },
        },
        { $addFields: { total: { $sum: ["$pt_master", "$cm_master"] } } },
        { $sort: { "operadora.nombre": 1 } },
      ],
      (error, reportes) => {
        if (error) return reject(error.message);
        resolve(reportes);
      }
    );
  });
}
function buscar_sorteo(usuarioId, rol, operadora, desde, hasta, moneda) {
  return new Promise((resolve, reject) => {
    const comision = comisionMap[rol];
    const participacion = participacionMap[rol];
    desde = new Date(desde);
    desde.setHours(0, 0, 0);
    hasta = new Date(hasta);
    hasta.setHours(23, 59, 59);
    reporteModel.aggregate(
      [
        {
          $match: {
            jerarquia: ObjectId(usuarioId),
            fecha: { $gte: desde, $lte: hasta },
            operadora,
            moneda,
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
                    {
                      $multiply: ["$venta", comision, 0.01],
                    },
                  ],
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: "$sorteo",
            venta: { $sum: "$venta" },
            premio: { $sum: "$premio" },
            tickets: { $sum: "$numTickets" },
            subtotal: { $sum: "$subtotal" },
            comision: {
              $sum: {
                $multiply: ["$venta", comision, 0.01],
              },
            },
            participacion: {
              $sum: {
                $multiply: ["$subtotal", participacion, 0.01],
              },
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
            from: "sorteos",
            localField: "_id",
            foreignField: "_id",
            as: "sorteo",
          },
        },
        { $addFields: { sorteo: { $arrayElemAt: ["$sorteo", 0] } } },
        {
          $project: {
            venta: 1,
            premio: 1,
            tickets: 1,
            comision: 1,
            subtotal: 1,
            participacion: 1,
            total: 1,
            sorteo: "$sorteo.descripcion",
          },
        },
        { $sort: { sorteo: 1 } },
      ],
      (error, reportes) => {
        if (error) return reject(error.message);
        resolve(reportes);
      }
    );
  });
}
function negativos_usuario(
  usuarioId,
  rol,
  operadoras,
  desde,
  hasta,
  moneda = "ves"
) {
  const comision = comisionMap[rol];
  const participacion = participacionMap[rol];
  const rolNivel = rolMap[rol];
  desde = new Date(desde);
  hasta = new Date(hasta);
  hasta.setHours(23, 59, 59);
  return new Promise((resolve, reject) => {
    reporteModel.aggregate(
      [
        {
          $match: {
            jerarquia: ObjectId(usuarioId),
            fecha: { $gte: desde, $lte: hasta },
            operadora: { $in: operadoras },
            moneda,
          },
        },
        {
          $addFields: {
            hijo: {
              $cond: [
                { $arrayElemAt: ["$jerarquia", rolNivel] },
                { $arrayElemAt: ["$jerarquia", rolNivel] },
                "$usuario",
              ],
            },
            subtotal: {
              $subtract: [
                "$venta",
                {
                  $sum: ["$premio", { $multiply: ["$venta", comision, 0.01] }],
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
              $sum: {
                $multiply: ["$venta", comision, 0.01],
              },
            },
            participacion: {
              $sum: {
                $multiply: ["$subtotal", participacion, 0.01],
              },
            },
          },
        },
        {
          $addFields: {
            total: { $subtract: ["$subtotal", "$participacion"] },
          },
        },
        { $match: { total: { $lt: 0 } } },
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
}
module.exports = {
  nuevo,
  reiniciar,
  buscar: {
    usuario: buscar_usuario,
    operadoras: buscar_operadoras,
    loterias: buscar_loteria,
    sorteos: buscar_sorteo,
    taquilla: buscar_taquilla,
    negativos: {
      usuarios: negativos_usuario,
    },
  },
};
