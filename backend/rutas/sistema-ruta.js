const RedisCache = require("../dto/redis-cache.dto");
const { esMaster } = require("../middlewares/usuario-middle");
const redisRepo = require("../repositorio/redis-repo");
const sistemaRepo = require("../repositorio/sistema-repo");
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
router.get("/sys_stats", esMaster, (req, res) => {
  sistemaService
    .stats()
    .then((stat) => res.json(stat))
    .catch((error) => res.json(crearError(error)));
});
module.exports = router;
