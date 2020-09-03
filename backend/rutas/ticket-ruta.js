const router = require("express").Router();
const Usuario = require("../dto/usuario-dto");
const usuarioMiddle = require("../middlewares/usuario-middle");
const ticketRepo = require("../repositorio/ticket-repo");
const ticketService = require("../servicios/ticket-service");
const { crearError } = require("../utils/error-util");

router.post("/venta", usuarioMiddle.puedeVender, (req, res) => {
  /** @type {Usuario} */
  const taquilla = req.taquilla;
  /** @type {Array} */
  const ventas = req.body;
  if (ventas.length == 0) return res.json(crearError("ventas invalidas"));
  ticketService
    .nuevo(taquilla, ventas)
    .then((ticket) => {
      res.json(ticket);
    })
    .catch((error) => res.json(crearError(error)));
});

router.get("/buscar/serial", usuarioMiddle.validarJerarquia, (req, res) => {
  const { serial } = req.query;
  ticketRepo.buscar
    .serial(req.usuario._id, serial)
    .then((ticket) => res.json(ticket))
    .catch((error) => res.json(crearError(error)));
});
router.get("/buscar/fecha", (req, res) => {
  const { desde, hasta } = req.query;
  const usuarioId =
    req.user.rol == Usuario.MASTER ? req.query.usuario : req.user._id;
  ticketRepo.buscar
    .fecha(usuarioId, desde, hasta)
    .then((ticket) => res.json(ticket))
    .catch((error) => res.json(crearError(error)));
});
router.get("/buscar/ultimos", usuarioMiddle.validarJerarquia, (req, res) => {
  const limite = 50;
  const { pagina } = req.query;
  ticketRepo.buscar
    .ultimos(req.usuario._id, pagina * limite, limite)
    .then((tickets) => res.json(tickets))
    .catch((error) => res.json(crearError(error)));
});
router.get("/buscar/premiados", usuarioMiddle.validarJerarquia, (req, res) => {
  const { premiado, pagina } = req.query;
  ticketRepo.buscar
    .ultimos_premiados(
      req.usuario._id,
      premiado == "true",
      parseInt(pagina),
      50
    )
    .then((tickets) => res.json(tickets))
    .catch((error) => res.json(crearError(error)));
});

router.get("/monitor/admin", (req, res) => {
  const { sorteo, rol } = req.query;
  ticketService.monitor
    .admin(sorteo, rol)
    .then((monitor) => res.json(monitor))
    .catch((error) => res.json(crearError(error)));
});
router.get("/monitor/numero", (req, res) => {
  const { sorteo } = req.query;
  ticketService.monitor
    .numero(sorteo)
    .then((monitor) => res.json(monitor))
    .catch((error) => res.json(crearError(error)));
});
router.get("/administrador", usuarioMiddle.validarJerarquia, (req, res) => {
  const { sorteo, usuario } = req.query;
  ticketRepo.monitor
    .ticket_admin(sorteo, usuario)
    .then((tickets) => {
      res.json(tickets);
    })
    .catch((error) => res.json(crearError(error)));
});
module.exports = router;
