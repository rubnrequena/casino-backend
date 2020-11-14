const { request, response } = require("express");
const { crearError } = require("../../utils/error-util");

const Usuario = require("../../dto/usuario-dto");
const reporteRepo = require("../../repositorio/reporte-repo");
const ticketService = require("../../servicios/ticket-service");

function auth(params) {}

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
    .then((reportes) => res.json(reportes))
    .catch((error) => res.json(crearError(error)));
}

function reporte_tickets() {}
function reporte_caja() {}

/**
 * @param {request} req
 * @param {response} res
 */
function ticket_anular(req, res) {
  const { serial, codigo } = req.body;
  ticketService
    .anular(req.user, serial, codigo)
    .then((result) => res.json(result))
    .catch((error) => res.json(crearError(error)));
}

module.exports = {
  reportes: {
    general: reporte_general,
    tickets: reporte_tickets,
    caja: reporte_caja,
  },
  tickets: {
    anular: ticket_anular,
  },
};
