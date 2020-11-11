const router = require("express").Router();

const axios = require("axios").default;
const dateUtil = require("../utils/date-util");
const Usuario = require("../dto/usuario-dto");
const Saldo = require("../dto/saldo-dto");

const { validarPOST } = require("../middlewares");
const saldoService = require("../servicios/saldo-service");
const saldoRepo = require("../repositorio/saldo-repo");
const usuarioRepo = require("../repositorio/usuario-repo");

let queue = {};
const apiKey = "9ed76d0c-8f7a-4af6-b0e1-65b561c2c0f1";

const validarTransaccion = validarPOST(
  "PlayerId:objectid,amount:number,description,reference,typeTransaction,Apikey"
);

router.post("/saldo", validarPOST("PlayerId:objectid,Apikey"), saldo_POST);
router.post("/transaccion", validarTransaccion, transaacion_POST);

router.get("/url", url_GET);
router.get("/saldocambio", saldocambio_GET);

function saldo_POST(req, res) {
  let { PlayerId, Apikey } = req.body;
  if (Apikey != apiKey)
    return res
      .status(401)
      .json({ error: "Acceso no autorizado, Apikey invalido" });
  usuarioRepo.buscar
    .id(PlayerId)
    .then((usuario) => {
      if (!usuario.activo) res.json({ error: "usuario inactivo", balance: 0 });
      saldoRepo
        .ultimoSaldo(usuario._id)
        .then((saldo) => res.json({ balance: saldo.balance }))
        .catch(() =>
          res.json({ error: "ocurrio un error al consultar saldo" })
        );
    })
    .catch(() =>
      res.json({ error: "ocurrio un error al consultar usuario", balance: 0 })
    );
}
function transaacion_POST(req, res) {
  let {
    PlayerId,
    amount,
    description,
    reference,
    typeTransaction,
    Apikey,
  } = req.body;
  if (Apikey != apiKey)
    return res
      .status(401)
      .json({ error: "Acceso no autorizado, Apikey invalido" });
  usuarioRepo.buscar
    .id(PlayerId)
    .then(async (usuario) => {
      let metodo = await saldoRepo.metodo_pago.buscar.id(
        "5f5ba4a941cdc613c02aaf3c"
      );
      if (!metodo)
        return res.json({
          error: "transaccion no tiene metodo de pago disponible",
          balance: 0,
        });
      if (typeTransaction == "recarga") {
        saldoService
          .acreditar(usuario, `HIPICO - ${description}`, amount)
          .then(saldoResult)
          .catch((e) => res.json({ error: e, balance: -1 }));
      } else if (typeTransaction == "retiro") {
        saldoService
          .debitar(usuario, `HIPICO - ${description}`, amount)
          .then(saldoResult)
          .catch((e) => res.json({ error: e, balance: -1 }));
      }
    })
    .catch(() =>
      res.json({ error: "ocurrio un error al consultar usuario", balance: 0 })
    );

  /**
   *
   * @param {Saldo} saldo
   */
  function saldoResult(saldo) {
    res.json({
      transaccionId: saldo._id,
      balance: saldo.balance,
      tiempo: saldo.tiempo,
    });
    const userRespond = queue[saldo.usuario];
    if (userRespond) {
      userRespond.json(saldo);
    }
  }
}
async function url_GET(req, res) {
  const apiURL = "https://apicasiersweb.elinmejorable.bet/caribeapuesta/login";
  let usuario = await usuarioRepo.buscar.id(req.user._id);
  if (!usuario) res.json({ error: "usuario no existe" });
  if (!usuario.activo) res.json({ error: "usuario inactivo" });
  if (req.user.rol == Usuario.ONLINE) {
    const payLoad = {
      email: usuario.correo,
      cedula: usuario.cedula,
      usuario: usuario._id,
      empresa: "Caribe Apuesta",
      SubAgenteNombre: "caribeapuesta.com",
      moneda: "VES",
      api_key: "9268473c-f527-11ea-adc1-0242ac120002",
    };
    axios
      .post(apiURL, payLoad)
      .then((result) => {
        let url = result.data.data.url;
        res.json({ url });
      })
      .catch((error) => {
        res.json({ error: "imposible obtener url del juego" });
      });
  }
}
function saldocambio_GET(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-cache, must-revalidate");
  queue[req.user._id] = res;
  req.on("close", function () {
    console.log("cerrando conexion");
    delete queue[req.user._id];
  });
}
module.exports = router;
