const sorteoUtil = require("../utils/sorteo-util");
const mongoose = require("mongoose");

const Ticket = require("../dto/ticket-dto");
const Usuario = require("../dto/usuario-dto");
const Venta = require("../dto/venta-dto");
const Errores = require("../dto/errores.dto");

const anuladoModel = require("../modelos/anulado-model");

const sorteoRepo = require("../repositorio/sorteo-repo");
const ticketRepo = require("../repositorio/ticket-repo");
const redisRepo = require("../repositorio/redis-repo");
const operadoraRepo = require("../repositorio/operadora-repo");

const topeService = require("./tope-service");
const ticketModel = require("_modelos/ticket-model");

/** JSDoc
 * @param {Usuario} taquilla
 * @param {Array<Venta>} ventas
 * @returns {Promise<Ticket>}
 */
function nuevo(taquilla, ventas) {
  return new Promise(async (resolve, reject) => {
    var sorteosCerrados = [];
    for (let i = 0; i < ventas.length; i++) {
      const venta = ventas[i];
      let sorteo = cacheOperadora[venta.sorteo];
      cache = true;
      if (!sorteo) {
        sorteo = await sorteoRepo.buscar.id(venta.sorteo);
        cacheOperadora[venta.sorteo] = sorteo;
        cache = false;
      }
      venta.operadora = sorteo.operadora.toString();
      const abierto = sorteoUtil.estaAbierto(sorteo);
      if (!abierto) sorteosCerrados.add(sorteo._id);
    }
    if (sorteosCerrados.length > 0)
      return reject({
        code: Errores.SORTEO_CERRADO,
        error: `sorteos invalidos`,
        sorteos: sorteosCerrados,
      });
    topeService
      .validar(ventas, taquilla)
      .then(async () => {
        const ticket = await ticketRepo.nuevo(taquilla, ventas);
        resolve(ticket);
        let hash;
        //TODO: disminuir venta al anular ticket
        ventas.forEach((venta) => {
          taquilla.jerarquia.forEach((padre) => {
            //padre-sorteo
            hash = `${venta.sorteo}_${padre}`;
            redisRepo.hincrby(hash, venta.numero, venta.monto);
            redisRepo.expire(hash, 86400);
          });
          //taquilla-sorteo
          hash = `${venta.sorteo}_${taquilla._id}`;
          redisRepo.hincrby(hash, venta.numero, venta.monto);
          redisRepo.expire(hash, 86400);
          //sorteo
          hash = `venta-${venta.moneda}-${venta.sorteo}`;
          redisRepo.hincrby(hash, venta.numero, venta.monto);
          redisRepo.expire(hash, 86400);
        });
        //TODO notificar usuarios
      })
      .catch((error) => reject(error));
  });
}

/**
 * @param {Usuario} usuario
 * @param {String} serial
 * @returns {Promise<Ticket>}
 */
function buscar_serial(usuario, serial) {
  return ticketRepo.buscar.serial(serial).then((ticket) => {
    if (ticket.usuario.toString() == usuario._id.toString()) return ticket;
    else return null;
  });
}
/**
 * @param {Usuario} usuario
 * @param {String} serial
 * @returns {Promise<Ticket>}
 */
function buscar_ticket_serial(usuario, serial) {
  return ticketRepo.buscar.ticket_serial(serial).then((ticket) => {
    if (ticket.usuario.toString() == usuario._id.toString()) return ticket;
    else return null;
  });
}
/**
 *
 * @param {Usuario} usuario
 * @param {String} serial
 * @param {String} codigo
 * @param {String} responsable
 */
function pagar(usuario, serial, codigo, responsable) {
  return new Promise(async (resolve, reject) => {
    const ticket = await buscar_ticket_serial(usuario, serial);
    ticketRepo
      .pagar(ticket)
      .then((result) => resolve(result))
      .catch((error) => reject(error));
  });
}
/**
 * @param {Usuario} usuario
 * @param {String} serial
 * @param {String} codigo
 * @param {Responsable} responsable
 */
function anular(usuario, serial, codigo, responsable) {
  return new Promise(async (resolve, reject) => {
    const ticket = await buscar_ticket_serial(usuario, serial);
    //#region validacion
    if (!ticket) return reject("ticket no existe");
    const esPOS = usuario.rol.match(/taquilla|online/);
    if (esPOS)
      if (ticket.codigo != codigo)
        return reject("codigo de seguridad invalido");
    //#endregion
    const ventas = await ticketRepo.buscar.ventas(ticket._id);
    for (let i = 0; i < ventas.length; i++) {
      const venta = ventas[i];
      const sorteo = await sorteoRepo.buscar.id(venta.sorteo);
      const now = Date.now();
      const sorteoCerrado = sorteo.abierta === false;
      const sorteoTiempoCerrado = now > sorteo.cierra.getTime();
      const tiempoVentaTranscurrido = now - venta.creado.getTime();
      if (
        sorteoCerrado ||
        sorteoTiempoCerrado ||
        tiempoVentaTranscurrido > 1000000
      ) {
        return reject("tiempo de anulacion expiró");
      }
    }
    const anulado = new anuladoModel({
      ticket: ticket._id,
      anulado: new Date(),
      responsable,
    });
    anulado.save(async (error) => {
      if (error) {
        if (error.code == 11000) return reject("ticket previamente anulado");
        else reject(error);
      }
      await ticketModel.updateOne({ _id: ticket._id }, { anulado: true });
      resolve(anulado);
    });
  });
}

let cacheOperadora = {};
module.exports = {
  nuevo,
  pagar,
  anular,
  monitor: {
    async admin(sorteoId, rol, moneda) {
      let sorteo = await sorteoRepo.buscar.id(sorteoId);
      let operadora = await operadoraRepo.buscar.id(sorteo.operadora);
      return ticketRepo.monitor.admin(sorteoId, rol, operadora.paga, moneda);
    },
    async numero(sorteoId, moneda) {
      let sorteo = await sorteoRepo.buscar.id(sorteoId);
      let operadora = await operadoraRepo.buscar.id(sorteo.operadora);
      return ticketRepo.monitor.numeros(sorteoId, operadora.paga, moneda);
    },
  },
  buscar: {
    serial: buscar_serial,
    ticketSerial: buscar_ticket_serial,
  },
};
