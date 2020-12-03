const usuarioRepo = require("../repositorio/usuario-repo");
const md5 = require("md5");
const Usuario = require("../dto/usuario-dto");

module.exports = {
  /** JSDoc
   * @param {Usuario} usuario
   * @param {Object} campos
   */
  editar(usuario, campos) {
    return usuarioRepo.modificar(usuario._id, campos);
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
  cambioClave(usuario, claveActual, claveNueva) {
    return new Promise(async (resolve, reject) => {
      const _usuario = await usuarioRepo.buscar.id(usuario._id)
      if (!_usuario) return reject('USUARIO NO EXISTE')
      if (_usuario.clave != md5(claveActual)) return reject('CONTRASEÑA ACTUAL INVALIDA')
      usuarioRepo.cambioClave(usuario._id, claveNueva).then(result => {
        resolve(result)
      }).catch(error => reject(error))
    });
  },
  permisos: {
    buscar: {
      /**
       * @param {String} usuarioId
       */
      todos(usuarioId) {
        return usuarioRepo.permisos.todos(usuarioId);
      },
    },
    /**
     * @param {String} usuarioId
     * @param {String} permisoId
     */
    asignar(usuarioId, permisoId) {
      return usuarioRepo.permisos.asignar(usuarioId, permisoId);
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
