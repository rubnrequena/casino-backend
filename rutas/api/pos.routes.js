const { validarGET, validarPOST } = require("../../middlewares");
const {
  validarJerarquia,
  puedeVender,
} = require("../../middlewares/usuario-middle");
const topeService = require("../../servicios/tope-service");
const {
  auth,
  sorteos,
  reportes,
  tickets,
} = require("./pos.control");

const router = require("express").Router();

//#region AUTH
const validar_auth = validarPOST("usuario,clave");

router.post("/auth", validar_auth, auth.login);
router.post("/auth/cambiarclave", auth.cambiar);
router.get("/auth/recuperar_clave", auth.recuperar);
//#endregion

//#region SORTEO
const buscarFecha = validarGET("fecha,operadora:objectid");

router.get("/sorteo/disponibles", sorteos.disponibles);
router.get("/sorteo/buscar", buscarFecha, sorteos.buscar);
//#endregion

//#region REPORTES
const reporte_general = [validarGET("desde,hasta,moneda"), validarJerarquia];
const reporte_tickets = [validarGET("fecha,moneda"), validarJerarquia];

router.get("/reporte/general", reporte_general, reportes.general);
router.get("/reporte/tickets", reporte_tickets, reportes.tickets);
router.get("/reporte/caja", validarJerarquia, reportes.caja);
router.get("/reporte/caja/generar", (req, res) => { });
//#endregion

//#region TICKET
const anularTicket = validarPOST("serial,codigo:number");
const buscarTicket = [validarGET("serial"), validarJerarquia];
const pagarTicket = [validarPOST("serial,codigo:number,numero")];

router.post("/ticket/venta", puedeVender, tickets.venta);
router.get("/ticket/buscar", buscarTicket, tickets.buscar);
router.get("/ticket/buscar/ultimos", (req, res) => { });
router.post("/ticket/anular", anularTicket, tickets.anular);
router.post("/ticket/pagar", pagarTicket, tickets.pagar);
router.post("/ticket/devolucion", tickets.devolucion);
router.post('/ticket/validar', puedeVender, tickets.validar);
//#endregion
module.exports = router;
