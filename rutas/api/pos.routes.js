const { validarGET } = require("../../middlewares");
const { validarJerarquia } = require("../../middlewares/usuario-middle");
const { reportes } = require("./pos.control");

const router = require("express").Router();

router.post("/auth", (req, res) => {});

//#region REPORTES
const general = [validarGET("desde,hasta,moneda"), validarJerarquia];
router.get("/reporte/general/usuario", general, reportes.general);

router.get("/reporte/tickets", reportes.tickets);
router.get("/reporte/caja", reportes.caja);
//#endregion
module.exports = router;
