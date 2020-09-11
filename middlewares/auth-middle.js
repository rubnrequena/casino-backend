const config = require("../config");
const jwt = require("jsonwebtoken");
const redisRepo = require("../repositorio/redis-repo");
const RedisCache = require("../dto/redis-cache.dto");

const AUTH_CLONAR_ROUTE_VALIDATION = "usuario,nombre,clave,correo,telefono";

module.exports = {
  authJWT(req, res, next) {
    const excluciones = [
      "/auth",
      "/auth/registro_online",
      "/auth/activar",
      "/images",
      "/auth/recuperar",
      "/hipismo/saldo",
      "/hipismo/transaccion",
    ];
    let url = req.url.split("?")[0];
    const excluir = excluciones.indexOf(url) > -1;
    if (excluir) return next();

    var token = req.headers.authorization;
    if (!token) {
      return res.status(401).send({
        error: "Es necesario el token de autenticación",
      });
    }
    jwt.verify(token.replace("Bearer ", ""), config.jwtSecret, verificarFirma);

    async function verificarFirma(err, user) {
      if (err) res.status(401).json({ errmsg: "Acceso no autorizado" });
      else {
        const permisos = await redisRepo.hjson(
          RedisCache.PERMISOS,
          user.permisos
        );
        if (!permisos)
          res.status(401).json({ errmsg: "Sus permisos han sido revocados" });
        else {
          req.permisos = permisos.permisos;
          req.user = user;
          next();
        }
      }
    }
  },
  AUTH_CLONAR_ROUTE_VALIDATION,
};
