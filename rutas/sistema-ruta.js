const RedisCache = require("../dto/redis-cache.dto");
const Usuario = require("../dto/usuario-dto");
const { esMaster } = require("../middlewares/usuario-middle");
const redisRepo = require("../repositorio/redis-repo");
const saldoRepo = require("../repositorio/saldo-repo");
const sistemaRepo = require("../repositorio/sistema-repo");
const usuarioRepo = require("../repositorio/usuario-repo");
const sistemaService = require("../servicios/sistema-service");
const { crearError } = require("../utils/error-util");

const router = require("express").Router();

router.get("/juegos", (req, res) => {
  sistemaRepo
    .juegos()
    .then((juegos) => res.json(juegos))
    .catch((error) => res.json(crearError(error)));
});
router.post("/juego/nuevo", (req, res) => {
  sistemaService.juegos
    .nuevo(req.body.nombre)
    .then((juego) => res.json(juego))
    .catch((error) => res.json(crearError(error)));
});
router.get("/monedas", (req, res) => {
  redisRepo.hget_all(RedisCache.MONEDA).then((monedas) => {
    let _monedas = [];
    for (const moneda in monedas) {
      if (monedas.hasOwnProperty(moneda)) {
        _monedas.push(JSON.parse(monedas[moneda]));
      }
    }
    res.json(_monedas);
  });
});
router.get("/sys_stats", (req, res) => {
  if (req.user.rol == Usuario.MASTER) {
    sistemaService
      .stats()
      .then((stat) => res.json(stat))
      .catch((error) => res.json(crearError(error)));
  } else {
    usuarioRepo.buscar.contarHijos(req.user._id).then(async (result) => {
      let total = 0,
        activos = 0,
        papelera = 0;
      let grupos = result.reduce((acc, el) => {
        el.usuarios.map((item) => {
          total++;
          activos += item.activo ? 1 : 0;
          papelera += item.papelera ? 1 : 0;
        });
        acc[el._id] = el.n;
        return acc;
      }, {});
      const balance = await saldoRepo.buscar.hijos(req.user._id);
      res.json({ grupos, total, activos, papelera, balance });
    });
  }
});
module.exports = router;
