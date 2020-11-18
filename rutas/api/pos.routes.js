const { validarGET, validarPOST } = require("../../middlewares");
const {
  validarJerarquia,
  puedeVender,
} = require("../../middlewares/usuario-middle");
const {
  auth,
  sorteos,
  reportes,
  tickets: reporteTickets,
} = require("./pos.control");

const router = require("express").Router();

//#region AUTH
const validar_auth = validarPOST("usuario,clave");

router.post("/auth", validar_auth, auth.login);
router.post("/auth/cambiarclave", auth.cambiar);
router.get("/auth/recuperar_clave", auth.recuperar);
//#endregion

//#region SORTEO
const buscarFecha = validarGET("fecha");

router.get("/sorteo/disponibles", sorteos.disponibles);
router.get("/sorteo/buscar/fecha", buscarFecha, sorteos.buscar);
//#endregion

//#region REPORTES
const reporte_general = [validarGET("desde,hasta,moneda"), validarJerarquia];
const reporte_tickets = [validarGET("fecha,moneda"), validarJerarquia];

router.get("/reporte/general", reporte_general, reportes.general);
router.get("/reporte/tickets", reporte_tickets, reportes.tickets);
router.get("/reporte/caja", validarJerarquia, reportes.caja);
router.get("/api/pos/reporte/caja/generar", (req, res) => {});
//#endregion

//#region TICKET
const anular = validarPOST("serial,codigo:number");
const buscarTicket = [validarGET("serial"), validarJerarquia];

router.post("/ticket/venta", puedeVender, reporteTickets.venta);
router.get("/ticket/buscar", buscarTicket, reporteTickets.buscar);
router.get("/ticket/buscar/ultimos", (req, res) => {});
router.post("/ticket/anular", anular, reporteTickets.anular);
router.get("/ticket/pagar", reporteTickets.pagar);
router.post("/ticket/devolucion", reporteTickets.devolucion);
//#endregion
module.exports = router;
