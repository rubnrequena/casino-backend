const Usuario = require("../dto/usuario-dto");
const { validarPOST, validarGET } = require("../middlewares");
const { validarJerarquia } = require("../middlewares/usuario-middle");
const usuarioMiddle = require("../middlewares/usuario-middle");
const saldoRepo = require("../repositorio/saldo-repo");
const saldoService = require("../servicios/saldo-service");
const { crearError } = require("../utils/error-util");

const router = require("express").Router();

router.post(
  "/recarga",
  validarPOST("monto:number,metodo,fecha,recibo"),
  (req, res) => {
    const { monto, metodo, fecha, recibo, mensaje } = req.body;
    saldoService
      .recarga(req.user, monto, metodo, fecha, recibo, mensaje)
      .then((transaccion) => {
        res.json(transaccion);
      })
      .catch((error) => res.json(crearError(error)));
  }
);
router.post("/retiro", [validarPOST("monto:number,metodo")], (req, res) => {
  const { monto, metodo, mensaje } = req.body;
  saldoService
    .retiro(req.user, monto, metodo, mensaje)
    .then((transaccion) => {
      res.json(transaccion);
    })
    .catch((error) => res.json(crearError(error)));
});
router.post("/procesar", validarJerarquia, (req, res) => {
  const { transaccion } = req.body;
  saldoService
    .procesar(transaccion)
    .then((result) => res.json(result))
    .catch((error) => res.json(crearError(error)));
});
router.post("/cancelar", validarJerarquia, (req, res) => {
  const { transaccion } = req.body;
  saldoService
    .cancelar(transaccion)
    .then((transaccion_result) => res.json(transaccion_result))
    .catch((error) => res.json(crearError(error)));
});
router.get("/balance", async (req, res) => {
  res.json(await saldoRepo.buscar.balance());
});

router.get("/recarga/historia", (req, res) => {
  const limite = parseInt(req.query.limite) || 10;
  const procesada = req.query.procesada || -1;
  saldoRepo.transaccion.buscar
    .historia(req.user._id, "recarga", limite, parseInt(procesada))
    .then((recargas) => res.json(recargas))
    .catch((error) => res.json(crearError(error)));
});
router.get("/recarga/historia/padre", (req, res) => {
  const limite = parseInt(req.query.limite) || 10;
  const procesada = req.query.procesada || -1;
  saldoRepo.transaccion.buscar
    .historia_padre(req.user._id, "recarga", limite, parseInt(procesada))
    .then((recargas) => res.json(recargas))
    .catch((error) => res.json(crearError(error)));
});

router.get("/retiro/historia", (req, res) => {
  const limite = parseInt(req.query.limite) || 10;
  const procesada = req.query.procesada || -1;
  saldoRepo.transaccion.buscar
    .historia(req.user._id, "retiro", limite, procesada)
    .then((retiros) => res.json(retiros))
    .catch((error) => res.json(crearError(error)));
});
router.get("/retiro/historia/padre", (req, res) => {
  const limite = parseInt(req.query.limite) || 10;
  const procesada = req.query.procesada || -1;
  saldoRepo.transaccion.buscar
    .historia_padre(req.user._id, "retiro", limite, parseInt(procesada))
    .then((recargas) => res.json(recargas))
    .catch((error) => res.json(crearError(error)));
});

router.get("/transaccion/historia", (req, res) => {
  const usuario =
    req.user.rol == Usuario.MASTER ? req.query.usuario : req.user._id;
  saldoRepo.buscar
    .usuario(usuario)
    .then((saldos) => res.json(saldos))
    .catch((error) => res.json(crearError(error)));
});

router.get("/metodopago/buscar/todos", (req, res) => {
  saldoRepo.metodo_pago.buscar
    .usuario(req.user._id)
    .then((metodos) => {
      res.json(metodos);
    })
    .catch((error) => res.json(crearError(error)));
});
router.get(
  "/metodopago/buscar",
  [validarGET("usuario:objectid"), usuarioMiddle.validarJerarquia],
  (req, res) => {
    const usuarioId = req.query.usuario;
    saldoRepo.metodo_pago.buscar
      .usuario(usuarioId)
      .then((metodos) => {
        res.json(metodos);
      })
      .catch((error) => res.json(crearError(error)));
  }
);
router.post("/metodopago/nuevo", (req, res) => {
  const { entidad, direccion, moneda, meta } = req.body;
  saldoService.metodo_pago
    .nuevo(req.user, entidad, direccion, moneda, meta)
    .then((metodo) => {
      res.json(metodo);
    })
    .catch((error) => res.json(crearError(error)));
});
router.post(
  "/metodopago/editar",
  validarPOST("_id:objectid,entidad,direccion,meta,moneda"),
  (req, res) => {
    const { _id, entidad, direccion, meta, moneda } = req.body;
    saldoRepo.metodo_pago
      .editar(_id, { entidad, direccion, meta, moneda })
      .then((result) => res.json(result))
      .catch((error) => res.json(crearError(error)));
  }
);
router.post(
  "/metodopago/remover",
  validarPOST("metodo:objectid,usuario:objectid"),
  (req, res) => {
    const { metodo } = req.body;
    saldoService.metodo_pago
      .remover(metodo, req.user._id)
      .then((metodo) => res.json(metodo))
      .catch((error) => res.json(crearError(error)));
  }
);
router.get("/metodopago/recargar", (req, res) => {
  /** @type {Usuario} */
  let usuario = req.user;
  const padreIdx = usuario.jerarquia.length - 1;
  const padreId = usuario.jerarquia[padreIdx];
  saldoRepo.metodo_pago.buscar
    .usuario(padreId, usuario.moneda)
    .then((metodos) => res.json(metodos))
    .catch((error) => res.json(crearError(error)));
});
module.exports = router;
