const router = require("express").Router();
const { crearError } = require("../utils/error-util");
const usuarioMiddle = require("../middlewares/usuario-middle");
const sorteoService = require("../servicios/sorteo-service");
const topeService = require("../servicios/tope-service");
const { validarPOST, validarGET } = require("../middlewares");
const sorteoRepo = require("../repositorio/sorteo-repo");
const topeRepo = require("../repositorio/tope-repo");
const dateUtil = require("../utils/date-util");

//#region middlewares
const nuevo = [
  usuarioMiddle.esMaster,
  validarPOST("operadora:objectod,desde,hasta"),
];
const premiar = [usuarioMiddle.esMaster, validarPOST("sorteo,numero")];
const reiniciar = [usuarioMiddle.esMaster, validarPOST("sorteo")];
const sinGanador = validarGET("operadora:objectid,fecha");
//#endregion

//#region /sorteos
router.post("/nuevo", nuevo, (req, res) => {
  let { desde, hasta, operadora } = req.body;
  sorteoService
    .registrar(desde, hasta, operadora)
    .then((sorteo) => {
      res.json(sorteo);
    })
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
  const { sorteo, ganador } = req.body;
  sorteoService
    .reiniciar(sorteo)
    .then(() => {
      if (ganador) {
        sorteoService
          .premiar(sorteo, ganador)
          .then((premio) => res.json(premio))
          .catch((error) => res.json(crearError(error)));
      } else {
        res.json({
          _id: sorteo,
          result: "reiniciado",
        });
      }
    })
    .catch((error) => res.json(crearError(error)));
});

router.get("/buscar/fecha", (req, res) => {
  let { desde, hasta, operadora, campos } = req.query;
  sorteoRepo.buscar
    .fecha(desde, hasta, operadora, campos)
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
router.get("/conganador", (req, res) => {
  sorteoRepo.buscar
    .conGanador()
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
//TODO: validar jerarquia de usuarios
router.post("/tope/nuevo", validarPOST("monto,operadora"), (req, res) => {
  let { usuario, monto, operadora, sorteo, numero } = req.body;
  let usuarioId = usuario || req.user._id;
  topeService
    .nuevo(usuarioId, monto, operadora, sorteo, numero)
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

router.get("/tope/buscar", usuarioMiddle.validarJerarquia, (req, res) => {
  let { operadora, sorteo } = req.query;
  topeRepo.buscar
    .por(operadora, req.usuario, sorteo)
    .then((sorteos) => {
      res.json(sorteos);
    })
    .catch((error) => res.json(crearError(error)));
});
//TODO: validar jerarquia de usuarios
router.post("/tope/remover/:topeId", (req, res) => {
  topeService
    .remover(req.params.topeId)
    .then((result) => {
      res.json(result);
    })
    .catch((error) => res.json(crearError(error)));
});

//#endregion

module.exports = router;
