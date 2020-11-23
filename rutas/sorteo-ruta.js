const router = require("express").Router();
const { crearError } = require("../utils/error-util");
const usuarioMiddle = require("../middlewares/usuario-middle");
const sorteoService = require("../servicios/sorteo-service");
const topeService = require("../servicios/tope-service");
const { validarPOST, validarGET } = require("../middlewares");
const sorteoRepo = require("../repositorio/sorteo-repo");
const topeRepo = require("../repositorio/tope-repo");
const dateUtil = require("../utils/date-util");
const { validarJerarquia } = require("../middlewares/usuario-middle");
const Usuario = require("../dto/usuario-dto");

//#region middlewares
const nuevo = [
  usuarioMiddle.esMaster,
  validarPOST("operadora:objectid,desde,hasta"),
];
const premiar = [
  usuarioMiddle.esMaster,
  validarPOST("sorteo:objectid,numero:string"),
];
const reiniciar = [usuarioMiddle.esMaster, validarPOST("sorteo")];
const sinGanador = validarGET("operadora:objectid,fecha");

const topeRemover = [validarJerarquia, validarPOST("tope:objectid")];
//#endregion

//#region /sorteos
router.post("/nuevo", nuevo, (req, res) => {
  let { desde, hasta, operadora } = req.body;
  sorteoService
    .registrar(desde, hasta, operadora)
    .then((sorteo) => res.json(sorteo))
    .catch((error) => res.json(crearError(error)));
});
router.get("/disponibles", (req, res) => {
  const hoy = dateUtil.isoDate();
  sorteoService.buscar
    .disponibles(req.user, hoy)
    .then((sorteos) => res.json(sorteos))
    .catch((error) => res.json(crearError(error)));
});

router.get("/abrir/:sorteo", usuarioMiddle.esMaster, (req, res) => {
  sorteoService
    .abrir(req.params.sorteo)
    .then((result) => {
      res.json({
        result: "ok",
      });
    })
    .catch((error) => res.json(crearError(error)));
});
router.get("/cerrar/:sorteo", usuarioMiddle.esMaster, (req, res) => {
  sorteoService
    .cerrar(req.params.sorteo)
    .then((result) => {
      res.json({
        result: "ok",
      });
    })
    .catch((error) => res.json(crearError(error)));
});

router.post("/premiar", premiar, (req, res) => {
  const { sorteo, numero } = req.body;
  sorteoService
    .premiar(sorteo, numero)
    .then((premio) => res.json(premio))
    .catch((error) => res.json(crearError(error)));
});
router.post("/reiniciar", reiniciar, (req, res) => {
  const { sorteo } = req.body;
  sorteoService
    .reiniciar(sorteo)
    .then((result) => {
      res.json(result);
    })
    .catch((error) => res.json(crearError(error)));
});

router.get("/buscar/fecha", (req, res) => {
  let { fecha, operadora } = req.query;
  sorteoService.buscar
    .fecha(fecha, operadora)
    .then((sorteos) => res.json(sorteos))
    .catch((error) => res.json(crearError(error)));
});
router.get("/singanador", sinGanador, (req, res) => {
  const { operadora, fecha } = req.query;
  sorteoRepo.buscar
    .sinGanador(operadora, fecha)
    .then((sorteos) => res.json(sorteos))
    .catch((error) => res.json(crearError(error)));
});
router.get("/conganador", validarGET("operadora:objectid"), (req, res) => {
  const { operadora } = req.query;
  sorteoRepo.buscar
    .conGanador(operadora)
    .then((sorteos) => res.json(sorteos))
    .catch((error) => res.json(crearError(error)));
});
router.get("/jaula", validarGET("operadora:objectid"), (req, res) => {
  sorteoRepo.buscar
    .jaula(req.query.operadora)
    .then((numeros) => res.json(numeros))
    .catch((error) => res.json(crearError(error)));
});
//#endregion

//#region /tope
const topeNuevo = [
  validarJerarquia,
  validarPOST("usuario:objectid,monto:number,operadora:objectid"),
];
router.post("/tope/nuevo", topeNuevo, (req, res) => {
  let { usuario, monto, operadora, sorteo, numero } = req.body;
  if (usuario == req.user._id && req.user.rol != Usuario.MASTER) {
    return res.json({ error: "No tiene privilegios para completar la accion" });
  }
  topeService
    .nuevo(usuario, monto, operadora, sorteo, numero, req.user)
    .then((tope) => res.json(tope))
    .catch((error) => res.json(crearError(error)));
});
//TODO: validar jerarquia de usuarios
router.post("/tope/editar", (req, res) => {
  const { topeId, campos } = req.body;
  topeService
    .editar(topeId, campos)
    .then((tope) => {
      res.json(tope);
    })
    .catch((error) => res.json(crearError(error)));
});

const topeBuscar = [
  validarGET("usuario:objectid,operadora:objectid"),
  usuarioMiddle.validarJerarquia,
];
router.get("/tope/buscar", topeBuscar, (req, res) => {
  let { operadora } = req.query;
  topeRepo.buscar
    .por(operadora, req.usuario)
    .then((sorteos) => {
      res.json(sorteos);
    })
    .catch((error) => res.json(crearError(error)));
});
//TODO: validar jerarquia de usuarios
router.post("/tope/remover", topeRemover, async (req, res) => {
  const { tope } = req.body;
  topeRepo
    .ultimoHijo(tope, req.user._id)
    .then((hijo) => {
      if (hijo == req.user._id && req.user.rol != Usuario.MASTER)
        return res.json({
          error: "No tiene privilegios para completar la accion",
        });
      topeService
        .remover(tope)
        .then((result) => {
          res.json(result);
        })
        .catch((error) => res.json(crearError(error)));
    })
    .catch((error) => {
      res.json(crearError(error));
    });
});

//#endregion

module.exports = router;
