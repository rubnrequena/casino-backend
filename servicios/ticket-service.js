const Ticket = require("../dto/ticket-dto");
const Usuario = require("../dto/usuario-dto");
const Venta = require("../dto/venta-dto");
const Errores = require("../dto/errores.dto");

const anuladoModel = require("../modelos/anulado-model");

const sorteoRepo = require("../repositorio/sorteo-repo");
const ticketRepo = require("../repositorio/ticket-repo");
const operadoraRepo = require("../repositorio/operadora-repo");

const ticketModel = require("_modelos/ticket-model");
const ventaRepo = require("../repositorio/venta-repo");
const cacheRepo = require("../repositorio/cache-repo");
const ventaModel = require("_modelos/venta-model");

const topeService = require("./tope-service");

/** JSDoc
 * @param {Usuario} taquilla
 * @param {Array<Venta>} ventas
 * @returns {Promise<Ticket>}
 */
function validar(taquilla, ventas) {
  return new Promise((resolve, reject) => {
    cacheRepo.tickets.ultimo(taquilla._id).then(ticket => {
      const jugadas = ventas.length;
      const creado = new Date().getTime() - new Date(ticket.creado).getTime()
      const monto = ventas.reduce((total, venta) => {
        total += venta.monto
        return total;
      }, 0)
      if (monto == ticket.monto && jugadas == ticket.jugadas && creado < 30000)
        return reject({ codigo: Errores.ACCION_REPETIDA, error: 'RIESGO DE TICKET DUPLICADO' })
      resolve({ taquilla, ventas })
    }).catch(error => reject(error))
  });
}
function agruparVentas({ taquilla, ventas }) {
  return new Promise((resolve, reject) => {
    ventas = ventas.reduce((grupos, venta) => {
      let lventa = grupos.find(v => v.numero == venta.numero)
      if (lventa) lventa.monto += venta.monto
      else grupos.push(venta)
      return grupos
    }, [])
    resolve({ taquilla, ventas })
  });
}
/** JSDoc
 * @param {Usuario} taquilla
 * @param {Array<Venta>} ventas
 * @returns {Promise<Ticket>}
 */
function nuevo({ taquilla, ventas }) {
  return new Promise(async (resolve, reject) => {

    topeService
      .validar(ventas, taquilla)
      .then(async ({ aceptado, rechazado }) => {
        if (aceptado.length == 0) {
          return resolve({
            ticket: null,
            aceptado,
            rechazado
          });
        }
        const ticket = await ticketRepo.nuevo(taquilla, aceptado);
        resolve({
          ticket,
          aceptado,
          rechazado
        });
        ventas.forEach((venta) => {
          taquilla.jerarquia.forEach((padre) => {
            ventaRepo.cache.incrementar(padre, venta, taquilla.moneda);
          });
          ventaRepo.cache.incrementar(taquilla._id, venta, taquilla.moneda);
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
    const estaPagado = await ticketRepo.buscar.pagado(ticket._id);
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

module.exports = {
  nuevo,
  pagar,
  anular,
  validar,
  agrupar: agruparVentas,
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
