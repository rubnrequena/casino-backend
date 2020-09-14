const router = require("express").Router();

const { validarPOST } = require("../middlewares");
const saldoService = require("../servicios/saldo-service");
const saldoRepo = require("../repositorio/saldo-repo");
const usuarioRepo = require("../repositorio/usuario-repo");
const dateUtil = require("../utils/date-util");
const Usuario = require("../dto/usuario-dto");
const axios = require("axios").default;

const apiKey = "9ed76d0c-8f7a-4af6-b0e1-65b561c2c0f1";
router.post("/saldo", validarPOST("PlayerId:objectid,Apikey"), (req, res) => {
  let { PlayerId, Apikey } = req.body;
  if (Apikey != apiKey)
    return res
      .status(401)
      .json({ error: "Acceso no autorizado, Apikey invalido" });
  usuarioRepo.buscar
    .id(PlayerId)
    .then((usuario) => {
      //validar usuario activo
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
});
router.post(
  "/transaccion",
  validarPOST(
    "PlayerId:objectid,amount:number,description,reference,typeTransaction,Apikey"
  ),
  (req, res) => {
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
        let hoy = dateUtil.isoDate();
        let metodo = await saldoRepo.metodo_pago.buscar.id(
          "5f5ba4a941cdc613c02aaf3c"
        );
        if (!metodo)
          return res.json({
            error: "transaccion no tiene metodo de pago disponible",
          });
        if (typeTransaction == "recarga") {
          saldoService
            .recarga(usuario, amount, metodo._id, hoy, reference, description)
            .then(saldoResult);
        } else if (typeTransaction == "retiro") {
          saldoService
            .retiro(usuario, amount, metodo._id, description)
            .then(saldoResult)
            .catch((e) => console.log("error", e));
        }
      })
      .catch((e) =>
        res.json({ error: "ocurrio un error al consultar usuario", balance: 0 })
      );

    function saldoResult(transaccion) {
      saldoService
        .procesar(transaccion._id)
        .then((result) => {
          res.json({
            transaccionId: result._id,
            balance: result.balance,
            tiempo: result.tiempo,
          });
        })
        .catch((e) => res.json({ error: e }));
    }
  }
);

router.get("/url", async (req, res) => {
  const apiURL = "https://apicasiersweb.elinmejorable.bet/caribeapuesta/login";
  let usuario = await usuarioRepo.buscar.id(req.user._id);
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
});
module.exports = router;
