const router = require("express").Router();
const operadoraService = require("../servicios/operadora-service");
const { crearError } = require("../utils/error-util");
const { validarJerarquia, esMaster } = require("../middlewares/usuario-middle");
const { validarPOST, validarPermisos, validarGET } = require("../middlewares");
const operadoraRepo = require("../repositorio/operadora-repo");
const Permiso = require("../dto/permiso.dto");
const Usuario = require("../dto/usuario-dto");

//#region Permisos
const operadoraNueva = [
  validarPermisos(Permiso.operadora.crear),
  validarPOST("nombre,tipo,paga:int,numeros:objectid,sorteos:array"),
];
const buscarEnlace = [
  validarGET("usuario:objectid"),
  validarJerarquia,
  validarPermisos(Permiso.sorteos.leer),
];
const enlaceNuevo = [
  validarJerarquia,
  validarPermisos(Permiso.sorteos.crear),
  validarPOST("usuario:objectid,operadora:array,mostrar:boolean"),
];
const enlaceRemover = [
  validarPOST("usuario,enlace"),
  validarJerarquia,
  validarPermisos(Permiso.sorteos.elimina),
];
const enlaceActivar = [
  validarJerarquia,
  validarPermisos(Permiso.sorteos.edita),
  validarPOST("usuario:objectid,enlace:objectid,activo:boolean"),
];

const numeroNuevo = [
  validarPermisos(Permiso.operadora.crear),
  validarPOST("nombre,numeros:array"),
];

const usuarioPaga = [validarGET("usuario:objectid"), validarJerarquia];
//#endregion

router.post("/nueva", operadoraNueva, (req, res) => {
  const { nombre, tipo, paga, sorteos, numeros } = req.body;
  operadoraService
    .registro(nombre, tipo, paga, sorteos, numeros)
    .then((operadora) => {
      res.json(operadora);
    })
    .catch((err) => res.json(crearError(err)));
});

router.get("/buscar/enlaces", buscarEnlace, (req, res) => {
  const usuario = req.usuario;
  operadoraRepo.buscar
    .enlacesOperadora(usuario._id)
    .then((enlaces) => {
      res.json(enlaces);
    })
    .catch((error) => res.json(crearError(error)));
});
router.get("/buscar/todas", (req, res) => {
  operadoraRepo.buscar.todas().then((operadoras) => res.json(operadoras));
});
router.get("/buscar/disponibles", (req, res) => {
  operadoraRepo.buscar.disponibles().then((operadoras) => {
    res.json(operadoras);
  });
});

router.post("/enlace/nuevo", enlaceNuevo, (req, res) => {
  const { usuario, operadora, mostrar } = req.body;
  operadoraService
    .enlazar(usuario, operadora, mostrar)
    .then((enlace) => {
      res.json(enlace);
    })
    .catch((error) => res.json(crearError(error)));
});
router.post("/enlace/remover", enlaceRemover, (req, res) => {
  const { usuario, enlace } = req.body;
  operadoraService
    .enlaceRemover(usuario, enlace)
    .then((result) => res.json(result))
    .catch((error) => res.json(crearError(error)));
});
router.post("/enlace/activar", enlaceActivar, (req, res) => {
  let { usuario, enlace, activo } = req.body;
  operadoraService
    .enlaceActivar(usuario, enlace, activo)
    .then((result) => res.json(result))
    .catch((error) => res.json(crearError(error)));
});

router.get("/numero/todos", (req, res) => {
  operadoraRepo.numeros.buscar
    .todos()
    .then((numeros) => res.json(numeros))
    .catch((error) => res.json(crearError(error)));
});
router.get("/numero/:numero", (req, res) => {
  operadoraRepo.numeros.buscar
    .id(req.params.numero)
    .then((numero) => res.json(numero))
    .catch((error) => res.json(crearError(error)));
});
router.post("/numero", numeroNuevo, (req, res) => {
  const { nombre, numeros } = req.body;
  operadoraRepo.numeros
    .nuevo()
    .then((numero) => res.json(numero))
    .catch((error) => res.json(crearError(error)));
});

router.get("/usuario/paga", usuarioPaga, (req, res) => {
  operadoraRepo
    .paga(req.query.usuario)
    .then((pagos) => res.json(pagos))
    .catch((error) => res.json(crearError(error)));
});
const pagaNuevo = [
  esMaster,
  validarPOST("operadora:objectid,grupo:objectid,monto:number"),
];
router.post("/usuario/paga/nuevo", pagaNuevo, (req, res) => {
  const { operadora, grupo, monto } = req.body;
  operadoraService.paga
    .nuevo(operadora, grupo, monto)
    .then((result) => res.json(result))
    .catch((error) => res.json(crearError(error)));
});

//#region GruposPago
const grupoPagoNuevo = [
  validarPOST("nombre,descripcion,usuario:objectid"),
  validarJerarquia,
];
const grupoPagoRemover = [
  validarPOST("grupoId:objectid,usuario:objectid"),
  validarJerarquia,
];
const grupoPagoId = [validarGET("grupoId:objectid")];
router.get("/grupopago/id", grupoPagoId, (req, res) => {
  const { grupoId } = req.query;
  operadoraService.grupos
    .buscarId(grupoId)
    .then((result) => res.json(result))
    .catch((error) => res.json(crearError(error)));
});
router.get("/grupopago/todos", validarJerarquia, (req, res) => {
  const { usuario } = req.query;
  if (req.usuario.rol == Usuario.MASTER)
    operadoraRepo.grupos.buscar.todos().then(result).catch(error);
  else operadoraRepo.grupos.buscar.usuario(usuario).then(result).catch(error);

  function result(grupos) {
    res.json(grupos);
  }
  function error(error) {
    res.json(crearError(error));
  }
});
router.post("/grupopago/nuevo", grupoPagoNuevo, (req, res) => {
  const { nombre, descripcion } = req.body;
  operadoraService.grupos
    .nuevo(nombre, descripcion, req.usuario)
    .then((grupo) => res.json(grupo))
    .catch((error) => res.json(crearError(error)));
});
router.post("/grupopago/remover", grupoPagoRemover, (req, res) => {
  const { grupoId } = req.body;
  operadoraService.grupos
    .remover(grupoId, req.usuario)
    .then((result) => res.json(result))
    .catch((error) => res.json(crearError(error)));
});
//#endregion
module.exports = router;
