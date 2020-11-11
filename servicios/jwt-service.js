const config = require("_src/config/index");
const jwt = require("jsonwebtoken");
const Usuario = require("../dto/usuario-dto");
const Permiso = require("../dto/permiso.dto");

module.exports = {
  /**
   *
   * @param {Usuario} usuario
   * @param {Permiso} permiso
   */
  firmar(usuario, permisoId) {
    let payload = {
      _id: usuario._id,
      nombre: usuario.nombre,
      rol: usuario.rol,
      jerarquia: usuario.jerarquia,
      moneda: usuario.moneda,
      permisos: permisoId,
      //TODO enviar sesion al cliente
    };
    var token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: 60 * 60 * 24,
    });
    return token;
  },
  firmarAPI(usuario) {
    var token = jwt.sign(usuario, config.jwtSecret, {
      expiresIn: 60 * 60 * 24,
    });
    return token;
  },
};
