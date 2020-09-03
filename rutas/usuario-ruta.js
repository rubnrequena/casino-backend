var express = require("express");
const usuarioMiddle = require("../middlewares/usuario-middle");
const { validarGET, validarPermisos } = require("../middlewares/index");
const usuarioRepo = require("../repositorio/usuario-repo");
const usuarioService = require("../servicios/usuario-service");
const { crearError } = require("../utils/error-util");
const { validarJerarquia } = require("../middlewares/usuario-middle");
const operadoraRepo = require("../repositorio/operadora-repo");
const Permiso = require("../dto/permiso.dto");
const saldoRepo = require("../repositorio/saldo-repo");
var router = express.Router();

/* GET users listing. */
router.post("/cambiar_clave", validarJerarquia, (req, res) => {
  const { clave } = req.body;
  usuarioRepo
    .cambioClave(req.usuario, clave)
    .then((result) => res.json(result))
    .catch((error) => res.json(crearError(error)));
});
router.post("/editar", validarJerarquia, function (req, res) {
  //FIXME validar campos a editar
  usuarioService
    .editar(req.body.usuario, req.body.editar)
    .then((usuario) => {
      res.json(usuario);
    })
    .catch((err) => crearError(err));
});

router.post("/activo", validarJerarquia, (req, res) => {
  usuarioService
    .activo(req.usuario)
    .then((result) => res.json(result))
    .catch((error) => res.json(crearError(error)));
});
router.post("/papelera", validarJerarquia, (req, res) => {
  usuarioService
    .papelera(req.usuario)
    .then((result) => res.json(result))
    .catch((error) => res.json(crearError(error)));
});
router.get(
  "/stat",
  [usuarioMiddle.validarJerarquia, validarGET("usuario:objectid")],
  (req, res) => {
    usuarioRepo.buscar
      .stat(req.usuario._id)
      .then((stat) => {
        res.json(stat);
      })
      .catch((error) => res.json(crearError(error)));
  }
);

router.get(
  "/buscar/usuario/:usuario",
  usuarioMiddle.validarJerarquia,
  (req, res) => {
    usuarioRepo.buscar
      .id(req.params.usuario)
      .then(async (usuario) => {
        if (req.query.project.indexOf("stats") > -1) {
          usuario.stats = await usuarioRepo.buscar.stat(usuario._id);
        }
        res.json(usuario);
      })
      .catch((error) => res.json(crearError(error)));
  }
);
router.get("/buscar/rol/:rol", (req, res) => {
  let usuario = req.query.usuario || req.user._id;
  usuarioRepo.buscar
    .rol(usuario, req.params.rol)
    .then((usuarios) => {
      res.json(usuarios);
    })
    .catch((error) => res.json(crearError(error)));
});
router.get("/buscar/hijos", (req, res) => {
  usuarioRepo.buscar
    .hijos(req.user._id)
    .then((usuarios) => res.json(usuarios))
    .catch((error) => res.json(crearError(error)));
});
router.get(
  "/buscar/hijos_cercanos",
  usuarioMiddle.validarJerarquia,
  (req, res) => {
    usuarioRepo.buscar
      .hijosCercanos(req.usuario._id)
      .then((usuarios) => res.json(usuarios))
      .catch((error) => res.json(crearError(error)));
  }
);

router.get("/saldo", validarJerarquia, (req, res) => {
  saldoRepo
    .ultimoSaldo(req.user._id)
    .then((saldo) => res.json(saldo))
    .catch((error) => res.json(crearError(error)));
});
router.get(
  "/enlaces",
  [validarJerarquia, validarPermisos(Permiso.sorteos.leer)],
  (req, res) => {
    operadoraRepo.buscar
      .enlacesUsuario(req.usuario._id)
      .then((enlaces) => res.json(enlaces))
      .catch((error) => res.json(crearError(error)));
  }
);
router.get("/transaccion/stat", (req, res) => {
  usuarioService.reportes
    .transacciones(req.user)
    .then((transacciones) => res.json(transacciones))
    .catch((error) => res.json(crearError(error)));
});
//#region PERMISOS
router.get("/permisos/todos", (req, res) => {
  usuarioService.permisos.buscar
    .todos(req.query.modo)
    .then((permisos) => {
      res.json(permisos);
    })
    .catch((error) => res.json(crearError(error)));
});
//#endregion

module.exports = router;
