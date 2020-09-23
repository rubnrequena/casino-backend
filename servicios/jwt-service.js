const config = require("_src/config/index");
const jwt = require("jsonwebtoken");
const Usuario = require("../dto/usuario-dto");

module.exports = {
  /**
   *
   * @param {Usuario} usuario
   */
  firmar(usuario) {
    let payload = {
      _id: usuario._id,
      nombre: usuario.nombre,
      rol: usuario.rol,
      jerarquia: usuario.jerarquia,
      moneda: usuario.moneda,
      //TODO enviar sesion al cliente
    };
    if (usuario.permisos) payload.permisos = usuario.permisos._id;
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
