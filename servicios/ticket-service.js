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
const ventaRepo = require("../repositorio/venta-repo");
const ventaModel = require("_modelos/venta-model");

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
        if (!sorteo) return reject({ error: 'SORTEOS INVALIDOS' })
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
        //TODO: disminuir venta al anular ticket
        ventas.forEach((venta) => {
          taquilla.jerarquia.forEach((padre) => {
            //padre-sorteo
            ventaRepo.cache.incrementar(padre, venta, taquilla.moneda);
          });
          //taquilla-sorteo
          ventaRepo.cache.incrementar(taquilla._id, venta, taquilla.moneda);
          //sorteo
          ventaRepo.cache.incrementar("venta", venta, taquilla.moneda);
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
  const jerarquia = [...usuario.jerarquia, usuario._id]
  return ticketRepo.buscar.serial(serial, jerarquia)
}
/**
 * @param {Usuario} usuario
 * @param {String} serial
 * @returns {Promise<Ticket>}
 */
function buscar_ticket_serial(usuario, serial) {
  const jerarquia = [...usuario.jerarquia, usuario._id]
  return ticketRepo.buscar.ticket_serial(serial, jerarquia);
}
/**
 * @param {Usuario} pos
 * @param {String} serial
 * @param {String} codigo
 * @param {String} numero
 * @param {Usuario} responsable
 */
function pagar(pos, serial, codigo, numero, responsable) {
  return new Promise(async (resolve, reject) => {
    const ticket = await buscar_ticket_serial(pos, serial);
    if (!ticket)
      return reject({ code: Errores.NO_EXISTE, error: "TICKET NO EXISTE" });
    const estaPagado = ticketRepo.buscar.pagado(ticket._id);
    if (estaPagado)
      return reject({
        code: Errores.TICKET_PAGADO,
        error: "TICKET PAGADO PREVIAMENTE",
      });

    if (ticket.codigo != codigo)
      return reject({
        code: Errores.TICKET_CODIGO_INVALIDO,
        error: "CODIGO DE TICKET INVALIDO",
      });
    const venta = await ventaRepo.buscar.premiado(ticket._id, numero);
    ticketRepo
      .pagar(venta, responsable._id)
      .then((result) => resolve(result))
      .catch((error) => reject(error));
  });
}
/**
 * @param {Usuario} pos
 * @param {String} serial
 * @param {String} codigo
 * @param {String} responsableId
 */
function anular(pos, serial, codigo, responsableId) {
  return new Promise(async (resolve, reject) => {
    const ticket = await buscar_ticket_serial(pos, serial);
    //#region validacion
    if (!ticket) return reject({ code: Errores.NO_EXISTE });
    const estaAnulado = await ticketRepo.buscar.anulado(ticket._id);
    if (estaAnulado)
      return reject({
        code: Errores.TICKET_ANULADO,
        error: "TICKET ANULADO PREVIAMENTE",
      });

    const esPOS = pos.rol.match(/taquilla|online/);
    if (esPOS)
      if (ticket.codigo != codigo)
        return reject({
          code: Errores.TICKET_CODIGO_INVALIDO,
          error: "CODIGO DE TICKET INVALIDO",
        });
    //#endregion
    const ventas = await ticketRepo.buscar.ventas(ticket._id);
    for (let i = 0; i < ventas.length; i++) {
      const venta = ventas[i];
      const sorteo = await sorteoRepo.buscar.id(venta.sorteo);
      const now = Date.now();
      const sorteoCerrado = sorteo.abierta === false;
      const sorteoTiempoCerrado = now > sorteo.cierra.getTime();
      const tiempoVentaTranscurrido = now - venta.creado.getTime();
      if (sorteoCerrado || sorteoTiempoCerrado) {
        return reject({ codigo: Errores.SORTEO_CERRADO, error: "SORTEO CERRADO" })
      } else {
        if (esPOS && tiempoVentaTranscurrido > 300000)
          return reject({ codigo: Errores.TICKET_ANULAR_TIEMPO_AGOTADO, error: "TIEMPO DE ANULACION EXPIRADO" });
      }
    }
    const anulado = new anuladoModel({
      _id: ticket._id,
      anulado: new Date(),
      responsable: responsableId,
    });
    anulado.save(async (error) => {
      if (error) {
        if (error.code == 11000)
          return reject({
            code: Errores.TICKET_ANULADO,
            error: "TICKET ANULADO PREVIAMENTE",
          });
        else reject(error);
      }
      const anular = { anulado: true };
      ventas.forEach((venta) => {
        ventaRepo.cache.disminuir(pos, venta);
      });
      await ticketModel.updateOne({ _id: ticket._id }, anular);
      await ventaModel.updateMany({ ticketId: ticket._id }, anular);
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
