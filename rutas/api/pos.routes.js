const { validarGET, validarPOST } = require("../../middlewares");
const { validarJerarquia } = require("../../middlewares/usuario-middle");
const { reportes, tickets } = require("./pos.control");

const router = require("express").Router();

router.post("/auth", (req, res) => {});

//#region REPORTES
const general = [validarGET("desde,hasta,moneda"), validarJerarquia];
router.get("/reporte/general/usuario", general, reportes.general);

router.get("/reporte/tickets", reportes.tickets);
router.get("/reporte/caja", reportes.caja);

const anular = validarPOST("serial,codigo:number");
router.post("/ticket/anular", anular, tickets.anular);
//#endregion
module.exports = router;
