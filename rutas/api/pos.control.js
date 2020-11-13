const { request, response } = require("express");
const Usuario = require("../../dto/usuario-dto");
const reporteRepo = require("../../repositorio/reporte-repo");
const { crearError } = require("../../utils/error-util");

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

module.exports = {
  reportes: {
    general: reporte_general,
    tickets: reporte_tickets,
    caja: reporte_caja,
  },
};
