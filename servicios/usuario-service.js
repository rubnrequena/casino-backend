const usuarioRepo = require("../repositorio/usuario-repo");
const md5 = require("md5");
const Usuario = require("../dto/usuario-dto");

module.exports = {
  /** JSDoc
   * @param {String} usuario
   * @param {Object} campos
   */
  editar(usuario, campos) {
    return usuarioRepo.modificar(usuario, campos);
  },
  /**
   * @param {Usuario} usuario
   */
  activo(usuario) {
    return usuarioRepo.modificar(usuario, { activo: !usuario.activo });
  },
  /**
   * @param {Usuario} usuario
   */
  papelera(usuario) {
    return usuarioRepo.modificar(usuario, { papelera: !usuario.papelera });
  },
  /** JSDoc
   * @param {Usuario} usuario
   * @param {String} claveActual
   * @param {String} claveNueva
   */
  cambioClave(usuario, clave) {
    //TODO Notificar cambio de contraseña
    return usuarioRepo.cambioClave(usuario._id, clave);
  },
  permisos: {
    buscar: {
      todos(modo) {
        if (modo && modo == "lista") return usuarioRepo.permisos.todos_lista();
        else usuarioRepo.permisos.todos();
      },
    },
  },
  reportes: {
    /**
     * @param {Usuario} usuario
     */
    async transacciones(usuario) {
      const aprobadas = await usuarioRepo.reporte.transacciones(usuario._id);
      const canceladas = await usuarioRepo.reporte.transacciones(
        usuario._id,
        true,
        true
      );
      const saldo = await usuarioRepo.saldo(usuario._id);
      return { aprobadas, canceladas, saldo };
    },
  },
};
