const Usuario = require("../dto/usuario-dto");
const Venta = require("../dto/venta-dto");
const Ticket = require("../dto/ticket-dto");
const Premiado = require("../dto/premiado-dto");
const Premio = require("../dto/premio-dto");

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { getRandomInt } = require("../utils/number-util");
const { ticketSerial } = require("../utils/ticket-util");
const ticketModel = require("_modelos/ticket-model");
const ventaModel = require("_modelos/venta-model");
const premioModel = require("_modelos/premio-model");
const saldoRepo = require("./saldo-repo");
const saldoService = require("../servicios/saldo-service");
const redisRepo = require("./redis-repo");
const RedisCache = require("../dto/redis-cache.dto");

/**
 * @param {Usuario} usuario
 * @param {Array<Venta>} ventas
 * @returns {Promise<Ticket>}
 */
function nuevo(usuario, ventas) {
  return new Promise(async (resolve, reject) => {
    const codigo = getRandomInt(1000, 9999);
    const serial = await ticketSerial();
    const monto = ventas.reduce((total, venta) => total + venta.monto, 0);
    let online = false;
    if (usuario.rol == Usuario.ONLINE) {
      let saldo = await redisRepo.hget(
        RedisCache.BALANCE,
        usuario._id,
        RedisCache.CAST_NUMBER
      );
      if (!saldo || saldo < monto) return reject("saldo insuficiente");
      online = true;
    }
    const creado = new Date();
    const ticket = {
      codigo,
      serial,
      usuario: ObjectId(usuario._id),
      creado,
      monto,
      anulado: false,
      jerarquia: usuario.jerarquia,
      online,
      moneda: usuario.moneda,
    };
    let saldo;
    if (usuario.rol == Usuario.ONLINE)
      saldo = await saldoService.debitar(
        usuario,
        `VENTA TICKET #${serial} `,
        monto
      );

    await redisRepo.hjson("tickets", ticket.serial, ticket);
    resolve({
      ticket: {
        serial: ticket.serial,
        codigo: ticket.codigo,
        creado: ticket.creado,
        monto: ticket.monto,
      },
      saldo,
    });
    ticketModel.collection.insertOne(ticket, (error, ticket) => {
      if (error) {
        if (usuario.rol == Usuario.ONLINE)
          saldoService.rollback(usuario, saldo);
        return reject(error);
      }
      ventas = ventas.map((venta) => {
        venta.ticketId = ticket.insertedId;
        venta.usuario = usuario._id;
        venta.jerarquia = usuario.jerarquia;
        venta.online = online;
        venta.moneda = usuario.moneda;
        venta.creado = creado;
        return venta;
      });
      ventaModel.insertMany(ventas, (error, result) => {
        if (error) {
          if (usuario.rol == Usuario.ONLINE)
            saldoService.rollback(usuario, saldo);
        }
      });
    });
  });
}
/**
 * @param {Ticket} ticket
 */
function anular(ticket) {
  ticketModel.updateOne(
    { _id: ticket._id },
    { anulado: true },
    (error, result) => {
      if (error) return reject(error.message);
      //TODO guardar en una tabla aparte referencia del ticket anulado
      resolve(result);
    }
  );
}
async function ventasPremiadas(sorteoId, ganador, operadoraPaga) {
  /** @type {Venta[]} */
  const ventas = await ventaModel.aggregate([
    {
      $match: {
        sorteo: mongoose.Types.ObjectId(sorteoId),
        numero: ganador,
      },
    },
    {
      $project: {
        ticketId: 1,
        usuario: 1,
        sorteo: 1,
        online: 1,
        premio: {
          $multiply: ["$monto", operadoraPaga],
        },
      },
    },
  ]);
  let premios = [];
  const now = new Date();
  for (let i = 0; i < ventas.length; i++) {
    const venta = ventas[i];
    /** @type {Premio} */
    const premio = {
      creado: now,
      pagado: false,
      ticketId: venta.ticketId,
      usuario: venta.usuario,
      premio: venta.premio,
      sorteo: venta.sorteo,
    };
    premios.push(premio);
  }
  premioModel.collection.insertMany(premios, (error) => {
    if (error) console.log("error al crear premios :>> ", error);
  });

  return ventas;
}
//#region Buscar
async function buscar_id(id) {
  let ticket = await ticketModel.findById(id).lean();
  const ventas = buscarVentas_ticket(await buscarVentas_ticket(ticket._id));
  for (let i = 0; i < ventas.length; i++) {
    const venta = ventas[i];
  }
}
/**
 * @param {String} serial
 * @return {Promise<Ticket>}
 */
async function buscar_serial(serial) {
  return new Promise((resolve, reject) => {
    ticketModel.aggregate(
      [
        {
          $match: {
            serial: serial.toUpperCase(),
          },
        },
        {
          $lookup: {
            from: "ventas",
            localField: "_id",
            foreignField: "ticketId",
            as: "ventas",
          },
        },
        {
          $lookup: {
            from: "sorteos",
            localField: "ventas.sorteo",
            foreignField: "_id",
            as: "sorteos",
          },
        },
        {
          $lookup: {
            from: "operadoras",
            localField: "sorteos.operadora",
            foreignField: "_id",
            as: "operadoras",
          },
        },
        {
          $project: {
            "ventas.operadora": 0,
            "ventas.jerarquia": 0,
            "ventas.ticketId": 0,
            "ventas.usuario": 0,
            "ventas.__v": 0,
            "sorteos.abierta": 0,
            "sorteos.fecha": 0,
            "sorteos.cierra": 0,
            "sorteos.__v": 0,
            "operadoras.sorteos": 0,
            "operadoras.tipo": 0,
            "operadoras.__v": 0,
          },
        },
      ],
      (error, tickets) => {
        if (error) return reject(error.message);
        if (tickets.length > 0) resolve(tickets[0]);
        else reject("ticket no existe");
      }
    );
  });
}

/**
 * @param {String} serial
 * @return {Promise<Ticket>}
 */
async function buscar_ticket_serial(serial) {
  return await ticketModel.findOne({ serial }).lean();
}
/**
 * @param {String} usuarioId
 * @param {Date} desde
 * @param {Date} hasta
 */
async function buscar_fecha(usuarioId, desde, hasta) {
  let condicion = { usuario: usuarioId };
  if (desde || hasta) {
    condicion.creado = {};
    desde = new Date(desde);
    hasta = new Date(hasta);
    hasta.setHours(24);
    if (desde) condicion.creado["$gte"] = desde;
    if (hasta) condicion.creado["$lte"] = hasta;
  }
  return await ticketModel.find(condicion).lean();
}

async function buscar_usuario(usuarioId) {
  await ticketModel.find({ jerarquia: usuarioId }).lean();
}
/**
 *
 * @param {String} usuarioId
 * @param {String} fecha
 * @returns {Promise<Ticket[]>}
 */
async function buscar_pos(usuarioId, fecha) {
  return new Promise((resolve, reject) => {
    const desde = new Date(fecha);
    const hasta = new Date(fecha);
    hasta.setHours(24);
    ticketModel.aggregate(
      [
        {
          $match: {
            usuario: ObjectId(usuarioId),
            creado: {
              $gte: desde,
              $lte: hasta,
            },
          },
        },
        { $project: { usuario: 0, jerarquia: 0, online: 0, moneda: 0 } },
      ],
      (error, tickets) => {
        if (error) return reject(error.message);
        resolve(tickets);
      }
    );
  });
}

/**
 * @param {String} sorteoId
 * @returns {Ticket[]}
 */
async function buscar_sorteo(sorteoId) {
  return await ticketModel
    .find({
      "ventas.sorteo": sorteoId,
    })
    .lean();
}
/**
 * @param {String} sorteoId
 * @param {String} ganador
 * @param {Number} operadoraPaga
 * @returns {Premiado[]}
 */
function buscar_premiados(sorteoId, ganador, operadoraPaga) {
  return new Promise((resolve, reject) => {
    ventaModel.aggregate(
      [
        {
          $match: {
            sorteo: ObjectId(sorteoId.toString()),
          },
        },
        {
          $project: {
            sorteo: 1,
            monto: 1,
            usuario: 1,
            premio: 1,
            numero: 1,
            operadora: 1,
            montoNumero: {
              $cond: [{ $eq: ["$numero", String(ganador)] }, "$monto", 0],
            },
          },
        },
        {
          $group: {
            _id: "$usuario",
            venta: { $sum: "$monto" },
            ventaNumero: { $sum: "$montoNumero" },
            numTickets: { $sum: 1 },
            operadora: { $last: "$operadora" },
          },
        },
        {
          $lookup: {
            from: "usuarios",
            foreignField: "_id",
            localField: "_id",
            as: "usuario",
          },
        },
        { $addFields: { usuario: { $arrayElemAt: ["$usuario", 0] } } },
        {
          $lookup: {
            let: {
              grupo: "$usuario.grupoPago",
              operadora: "$operadora",
            },
            from: "operadora_pagos",
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
            as: "paga",
          },
        },
        { $addFields: { paga: { $arrayElemAt: ["$paga", 0] } } },
        {
          $addFields: {
            paga: { $cond: ["$paga.monto", "$paga.monto", operadoraPaga] },
          },
        },
        {
          $project: {
            numTickets: 1,
            venta: 1,
            ventaNumero: 1,
            paga: 1,
            numero: 1,
            premio: {
              $multiply: ["$ventaNumero", "$paga"],
            },
            moneda: "$usuario.moneda",
          },
        },
      ],
      (error, premiados) => {
        if (error) return reject(error.message);
        resolve(premiados);
      }
    );
  });
}
async function buscar_ultimos(usuarioId, pagina, limite) {
  return await ticketModel
    .find({ usuario: usuarioId })
    .skip(pagina)
    .limit(limite)
    .sort({ creado: -1 })
    .lean();
}
/**
 * @param {String} usuarioId
 * @param {Boolean} premiado
 * @param {Number} pagina
 * @param {Number} limite
 */
async function ultimos_premiados(
  usuarioId,
  premiado = true,
  pagina = 0,
  limite = 50
) {
  return new Promise((resolve, reject) => {
    ticketModel.aggregate(
      [
        { $match: { usuario: ObjectId(usuarioId), anulado: false } },
        {
          $lookup: {
            from: "ventas",
            foreignField: "ticketId",
            localField: "_id",
            as: "ventas",
          },
        },
        { $match: { "ventas.premio": premiado } },
        {
          $project: {
            ventas: 0,
            online: 0,
            jerarquia: 0,
            codigo: 0,
            usuario: 0,
            anulado: 0,
          },
        },
        { $skip: pagina * limite },
        { $limit: limite },
      ],
      (error, tickets) => {
        if (error) return reject(error.message);
        resolve(tickets);
      }
    );
  });
}
/**
 *
 * @param {String} ticketId
 * @returns {Promise<Venta[]>}
 */
async function ventas(ticketId) {
  return await ventaModel.find({ ticketId }).lean();
}
//#endregion

function operadora(operadoraId) {}

/**
 * @param {String} ticketId
 * @returns {Venta[]}
 */
async function buscarVentas_ticket(ticketId) {
  return ventaModel
    .find({
      ticketId,
    })
    .lean();
}

/**
 * @param {String} sorteoId ID del sorteo
 * @param {Number} operadoraPaga cuanto paga la operadora
 */
function monitor_numeros(sorteoId, operadoraPaga, moneda) {
  return new Promise((resolve, reject) => {
    ventaModel.aggregate(
      [
        { $match: { sorteo: ObjectId(sorteoId), moneda } },
        {
          $project: {
            premio: 1,
            numero: 1,
            monto: 1,
            rol: { $arrayElemAt: ["$jerarquia", 4] },
          },
        },
        {
          $group: {
            _id: "$numero",
            jugado: { $sum: "$monto" },
            jugadas: { $sum: 1 },
          },
        },
        {
          $project: {
            jugado: 1,
            jugadas: 1,
            premio: { $multiply: ["$jugado", operadoraPaga] },
          },
        },
      ],
      (error, result) => {
        if (error) return reject(error.message);
        resolve(result);
      }
    );
  });
}
function monitor_admin(sorteoId, rol, operadoraPaga, moneda) {
  return new Promise((resolve, reject) => {
    const rolIndex = Usuario.NIVELES.indexOf(rol);
    ventaModel.aggregate(
      [
        { $match: { sorteo: ObjectId(sorteoId), moneda } },
        {
          $project: {
            premio: 1,
            numero: 1,
            monto: 1,
            rol: { $arrayElemAt: ["$jerarquia", rolIndex] },
          },
        },
        {
          $group: {
            _id: "$rol",
            jugado: { $sum: "$monto" },
            jugadas: { $sum: 1 },
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
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [{ $arrayElemAt: ["$usuario", 0] }, "$$ROOT"],
            },
          },
        },
        {
          $lookup: {
            from: "usuarios",
            localField: "jerarquia",
            foreignField: "_id",
            as: "jerarquia",
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [{ $arrayElemAt: ["$jerarquia", 0] }, "$$ROOT"],
            },
          },
        },
        {
          $project: {
            padres: "$jerarquia.nombre",
            nombre: 1,
            rol: 1,
            jugado: 1,
            jugadas: 1,
            premio: { $multiply: ["$jugado", operadoraPaga] },
          },
        },
      ],
      (error, result) => {
        if (error) return reject(error.message);
        resolve(result);
      }
    );
  });
}
function ticket_admin(sorteoId, usuarioId) {
  return new Promise((resolve, reject) => {
    ventaModel.aggregate(
      [
        {
          $match: {
            sorteo: ObjectId(sorteoId),
            jerarquia: ObjectId(usuarioId),
          },
        },
        {
          $group: {
            _id: "$ticketId",
            apuestas: { $sum: 1 },
            monto: { $sum: "$monto" },
            ticketId: { $min: "$ticketId" },
            jerarquia: { $min: "$jerarquia" },
          },
        },
        {
          $lookup: {
            from: "tickets",
            localField: "ticketId",
            foreignField: "_id",
            as: "ticket",
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [{ $arrayElemAt: ["$ticket", 0] }, "$$ROOT"],
            },
          },
        },
        { $project: { ticket: 0, codigo: 0, ticketId: 0 } },
        {
          $lookup: {
            from: "usuarios",
            localField: "usuario",
            foreignField: "_id",
            as: "_usuario",
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [{ $arrayElemAt: ["$_usuario", 0] }, "$$ROOT"],
            },
          },
        },
        {
          $project: {
            _id: 1,
            creado: 1,
            jerarquia: 1,
            nombre: 1,
            serial: 1,
            anulado: 1,
            apuestas: 1,
            monto: 1,
            usuarioId: { $arrayElemAt: ["$_usuario._id", 0] },
          },
        },
        { $addFields: { agencia: { $arrayElemAt: ["$jerarquia", -1] } } },
        {
          $lookup: {
            from: "usuarios",
            foreignField: "_id",
            localField: "agencia",
            as: "agencias",
          },
        },
        { $set: { agencia: { $arrayElemAt: ["$agencias", 0] } } },
        {
          $project: {
            agencias: 0,
            "agencia.creado": 0,
            "agencia.activo": 0,
            "agencia.papelera": 0,
            "agencia.jerarquia": 0,
            "agencia.comision": 0,
            "agencia.participacion": 0,
            "agencia.moneda": 0,
            "agencia.clave": 0,
            "agencia.rol": 0,
            "agencia.correo": 0,
            "agencia.telefono": 0,
            "agencia.__v": 0,
            "agencia.usuario": 0,
            ticket: 0,
            codigo: 0,
            ticketId: 0,
          },
        },
      ],
      (error, tickets) => {
        if (error) return reject(error.message);
        resolve(tickets);
      }
    );
  });
}
/**
 * @param {String} sorteoId
 * @param {String} numero
 */
function ticket_admin_numero(sorteoId, numero) {
  return new Promise((resolve, reject) => {
    ventaModel.aggregate(
      [
        {
          $match: {
            sorteo: ObjectId(sorteoId),
            numero: numero,
          },
        },
        {
          $group: {
            _id: "$ticketId",
            apuestas: { $sum: 1 },
            monto: { $sum: "$monto" },
            ticketId: { $min: "$ticketId" },
            jerarquia: { $min: "$jerarquia" },
          },
        },
        {
          $lookup: {
            from: "tickets",
            localField: "ticketId",
            foreignField: "_id",
            as: "ticket",
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [{ $arrayElemAt: ["$ticket", 0] }, "$$ROOT"],
            },
          },
        },
        { $addFields: { agencia: { $arrayElemAt: ["$jerarquia", -1] } } },
        {
          $lookup: {
            from: "usuarios",
            foreignField: "_id",
            localField: "agencia",
            as: "agencias",
          },
        },
        { $set: { agencia: { $arrayElemAt: ["$agencias", 0] } } },
        {
          $project: {
            agencias: 0,
            "agencia.creado": 0,
            "agencia.activo": 0,
            "agencia.papelera": 0,
            "agencia.jerarquia": 0,
            "agencia.comision": 0,
            "agencia.participacion": 0,
            "agencia.moneda": 0,
            "agencia.clave": 0,
            "agencia.rol": 0,
            "agencia.correo": 0,
            "agencia.telefono": 0,
            "agencia.__v": 0,
            "agencia.usuario": 0,
            ticket: 0,
            codigo: 0,
            ticketId: 0,
          },
        },
      ],
      (error, ventas) => {
        if (error) return reject(error.message);
        resolve(ventas);
      }
    );
  });
}

/**
 * @param {String} usuarioId
 * @param {String} sorteoId
 * @param {String} numero
 * @returns {Number}
 */
function usuarioJugado_numero(usuarioId, sorteoId, numero) {
  return new Promise((resolve, reject) => {
    ventaModel.aggregate(
      [
        {
          $match: {
            sorteo: ObjectId(sorteoId),
            numero,
            $or: [
              { usuario: ObjectId(usuarioId) },
              { jerarquia: ObjectId(usuarioId) },
            ],
          },
        },
        { $group: { _id: "$numero", monto: { $sum: "$monto" } } },
      ],
      (error, result) => {
        if (error) return reject(error.message);
        if (result.length > 0) resolve(Number(result[0].monto));
        else resolve(0);
      }
    );
  });
}

module.exports = {
  nuevo,
  anular,
  ventasPremiadas,
  buscar: {
    id: buscar_id,
    serial: buscar_serial,
    ticket_serial: buscar_ticket_serial,
    pos: buscar_pos,
    usuario: buscar_usuario,
    sorteo: buscar_sorteo,
    premiados: buscar_premiados,
    fecha: buscar_fecha,
    usuarioJugado_numero,
    ultimos: buscar_ultimos,
    ultimos_premiados,
    ventas,
  },
  monitor: {
    numeros: monitor_numeros,
    admin: monitor_admin,
    ticket_admin,
    ticket_admin_numero,
  },
  operadora,
};
