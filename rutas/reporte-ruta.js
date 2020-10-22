const router = require("express").Router();
const Usuario = require("../dto/usuario-dto");
const { validarJerarquia } = require("../middlewares/usuario-middle");
const redisRepo = require("../repositorio/redis-repo");
const reporteService = require("../servicios/reporte-service");
const { crearError } = require("../utils/error-util");

router.post("/taquilla/:usuario", validarJerarquia, (req, res) => {
  /** @type {Usuario} */
  const usuario = req.usuario;
  reporteService
    .taquilla(usuario._id)
    .then((reportes) => res.json(reportes))
    .catch((error) => res.json(crearError(error)));
});

router.post("/admin/:usuario", validarJerarquia, (req, res) => {
  /** @type {Usuario} */
  const usuario = req.usuario;
  reporteService
    .admin(usuario)
    .then((reportes) => res.json(reportes))
    .catch((error) => res.json(crearError(error)));
});

router.get("/usuario", validarJerarquia, (req, res) => {
  //TODO: verificar moneda valida
  let { desde, hasta, moneda } = req.query;
  reporteService.buscar
    .usuario(req.usuario, desde, hasta, moneda)
    .then((reportes) => res.json(reportes))
    .catch((error) => res.json(crearError(error)));
});
router.get("/operadoras", validarJerarquia, (req, res) => {
  //TODO: verificar moneda valida
  let { desde, hasta, moneda } = req.query;
  reporteService.buscar
    .operadoras(req.usuario, desde, hasta, moneda)
    .then((reportes) => res.json(reportes))
    .catch((error) => res.json(crearError(error)));
});
router.get("/usuario/negativos", validarJerarquia, (req, res) => {
  //TODO: verificar moneda valida
  let { desde, hasta } = req.query;
  reporteService.buscar.negativos
    .usuario(req.usuario, desde, hasta)
    .then((reportes) => res.json(reportes))
    .catch((error) => res.json(crearError(error)));
});
router.get("/monitor/sorteos", (req, res) => {
  redisRepo.scan;
});
module.exports = router;
