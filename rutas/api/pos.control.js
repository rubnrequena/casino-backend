//#region IMPORT
const { request, response } = require("express");
var geoip = require("geoip-lite");

const { crearError } = require("../../utils/error-util");

const Usuario = require("../../dto/usuario-dto");

const reporteRepo = require("../../repositorio/reporte-repo");
const ticketRepo = require("../../repositorio/ticket-repo");
const sorteoRepo = require("../../repositorio/sorteo-repo");

const authService = require("../../servicios/auth-service");
const ticketService = require("../../servicios/ticket-service");
const usuarioService = require("../../servicios/usuario-service");
const sesionRepo = require("../../repositorio/sesion-repo");
//#endregion

//#region AUTH
/**
 * @param {request} req
 * @param {response} res
 */
function login(req, res) {
  let usuario = req.body.usuario;
  let clave = req.body.clave;
  usuario = usuario.toLowerCase();

  authService
    .login(usuario, clave)
    .then((usuario) => {
      delete usuario.jerarquia;
      delete usuario.clave;
      delete usuario.utilidad;
      delete usuario.activo;
      delete usuario.grupoPago;
      delete usuario.permisos;
      res.json({ error: "OK", ...usuario });
      //sesion
      var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      var geo = geoip.lookup(ip);
      sesionRepo.nueva(usuario._id, geo, req.useragent);
    })
    .catch((error) => {
      res.json({
        error,
      });
    });
}
/**
 * @param {request} req
 * @param {response} res
 */
function cambiar_clave(req, res) {
  const { clave } = req.body;
  usuarioService
    .cambioClave(req.user, clave)
    .then((result) => res.json({ error: "OK", ...result }))
    .catch((error) => res.json(crearError(error)));
}
/**
 * @param {request} req
 * @param {response} res
 */
function recuperar_clave(req, res) {
  res.json({ error: "funcion en desarrollo" });
}
//#endregion

//#region SORTEOS
/** GET api/sorteos/disponibles
 * @param {request} req
 * @param {response} res
 */
function sorteo_disponibles(req, res) {
  const { fecha } = req.query;
  sorteoRepo.buscar
    .disponibleEnlaces(fecha, req.user.jerarquia)
    .then((operadoras) => res.json({ error: "OK", operadoras }))
    .catch((error) => res.json(crearError(error)));
}
/** GET api/sorteos/buscar
 * @param {request} req
 * @param {response} res
 */
function sorteo_buscar(req, res) {
  let { fecha, operadora } = req.query;
  sorteoRepo.buscar
    .fecha(fecha, fecha, operadora, "")
    .then((sorteos) => res.json({ error: "OK", ...sorteos }))
    .catch((error) => res.json(crearError(error)));
}
//#endregion

//#region REPORTES
/**
 * @param {request} req
 * @param {response} res
 */
function reporte_general(req, res) {
  let { desde, hasta, moneda } = req.query;
  /** @type {Usuario} */
  const usuario = req.usuario;
  reporteRepo.buscar
    .taquilla(usuario._id, usuario.rol, desde, hasta, moneda)
    .then((reportes) =>
      res.json({
        error: "OK",
        reportes,
      })
    )
    .catch((error) => res.json(crearError(error)));
}

/**
 * @param {request} req
 * @param {response} res
 */
function reporte_tickets(req, res) {
  const { fecha } = req.query;
  ticketRepo.buscar
    .pos(req.user._id, fecha)
    .then((tickets) =>
      res.json({
        error: "OK",
        tickets,
      })
    )
    .catch((error) => res.json(crearError(error)));
}

/**
 * @param {request} req
 * @param {response} res
 */
function reporte_caja(req, res) {}
//#endregion

//#region TICKETS
/** POST
 * @param {request} req
 * @param {response} res
 */
function ticket_venta(req, res) {
  /** @type {Usuario} */
  const taquilla = req.taquilla;
  /** @type {Array} */
  const ventas = req.body;
  if (ventas.length == 0) return res.json(crearError("ventas invalidas"));
  ticketService
    .nuevo(taquilla, ventas)
    .then((ticket) => {
      ticket = { error: "OK", ...ticket };
      res.json(ticket);
    })
    .catch((error) => res.json(crearError(error)));
}
/** GET
 * @param {request} req
 * @param {response} res
 */
function ticket_buscar(req, res) {
  const { serial } = req.query;
  ticketService.buscar
    .serial(req.usuario, serial)
    .then((ticket) => {
      delete ticket.jerarquia;
      delete ticket.codigo;
      delete ticket.online;

      res.json({ error: "OK", ...ticket });
    })
    .catch((error) => res.json(crearError(error)));
}
/** POST
 * @param {request} req
 * @param {response} res
 */
function ticket_pagar(req, res) {
  const { serial, codigo } = req.body;
  ticketService
    .pagar(req.user, serial, codigo, req.user._id)
    .then((result) => res.json({ error: "OK", result }))
    .catch((error) => res.json(crearError(error)));
}
/** POST
 * @param {request} req
 * @param {response} res
 */
function ticket_anular(req, res) {
  const { serial, codigo } = req.body;
  ticketService
    .anular(req.user, serial, codigo, req.user._id)
    .then((ticket) => res.json({ error: "OK", ticket }))
    .catch((error) => res.json(crearError(error)));
}
/** POST
 * @param {request} req
 * @param {response} res
 */
function ticket_devolucion(req, res) {
  res.json({ error: "funcion en desarrollo" });
}
//#endregion

module.exports = {
  auth: {
    login,
    cambiar: cambiar_clave,
    recuperar: recuperar_clave,
  },
  sorteos: {
    disponibles: sorteo_disponibles,
    buscar: sorteo_buscar,
  },
  reportes: {
    general: reporte_general,
    tickets: reporte_tickets,
    caja: reporte_caja,
  },
  tickets: {
    venta: ticket_venta,
    buscar: ticket_buscar,
    pagar: ticket_pagar,
    anular: ticket_anular,
    devolucion: ticket_devolucion,
  },
};
