const usuarioRepo = require("../repositorio/usuario-repo");
const { MASTER, TAQUILLA, ONLINE } = require("../dto/usuario-dto");
const { isValidObjectId } = require("mongoose");
const redisRepo = require("../repositorio/redis-repo");

module.exports = {
  async validarJerarquia(req, res, next) {
    const padre = req.user._id;
    let reqUsuario =
      req.body.usuario || req.query.usuario || req.params.usuario;
    if (!reqUsuario || !isValidObjectId(reqUsuario)) reqUsuario = padre;

    if (padre == reqUsuario) {
      req.usuario = req.user;
      return next();
    }
    //TODO cache redis
    const usuario = await usuarioRepo.findById(reqUsuario);
    if (!usuario)
      return res.status(401).send({
        error: "Usuario no existe",
      });
    const esPadre = usuario.jerarquia.find((papa) => {
      return papa == padre;
    });
    if (esPadre) {
      req.usuario = usuario;
      return next();
    } else
      return res.status(401).send({
        error: "No tiene permisos para acceder a este recurso",
      });
  },
  esMaster(req, res, next) {
    if (req.user.rol == MASTER) next();
    else {
      return res.status(401).send({
        error: "No tiene permisos para acceder a este recurso",
      });
    }
  },
  async puedeVender(req, res, next) {
    const usuario = await redisRepo.cache("usuarios", req.user._id, buscarUsuario_mongo)
    if (!usuario)
      return res.status(401).send({
        error: "Usuario no existe",
      });
    if (usuario.activo && (usuario.rol == TAQUILLA || usuario.rol == ONLINE)) {
      req.taquilla = usuario;
      next();
    } else {
      return res.status(401).send({
        error: "No tiene permisos para acceder a este recurso",
      });
    }

    async function buscarUsuario_mongo() {
      return await usuarioRepo.findById(req.user._id)
    }
  },
};

