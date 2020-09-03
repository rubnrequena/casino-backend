const permisoModel = require("_modelos/permiso-model");
const Permiso = require("../dto/permiso.dto");

module.exports = {
  /**
   *
   * @param {String} nombre
   * @param {String} rol
   * @param {Boolean} predeterminado
   * @param {String[]} permisos
   * @param {String} usuario
   * @return {Promise<Permiso>}
   */
  nuevo(nombre, rol, predeterminado, permisos, usuario) {
    return new Promise((resolve, reject) => {
      new permisoModel({
        nombre,
        rol,
        predeterminado,
        permisos,
        usuario,
      }).save((error, permiso) => {
        if (error) return reject(error.message);
        resolve(permiso);
      });
    });
  },
  buscar: {
    async usuario(usuarioId) {
      return await permisoModel.find({ usuario: usuarioId }).lean();
    },
  },
};
