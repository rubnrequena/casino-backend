const permisoModel = require("../modelos/permiso-model");
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
  nuevo(nombre, predeterminado, permisos, usuario) {
    return new Promise(async (resolve, reject) => {
      if (predeterminado) {
        await permisoModel.updateMany(
          { usuario: usuario },
          { predeterminado: false }
        );
      }
      new permisoModel({
        nombre,
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
    /**
     *
     * @param {String} permisoId
     * @return {Promise<Permiso>}
     */
    async id(permisoId) {
      return await permisoModel.findById(permisoId).lean();
    },
    /**
     *
     * @param {String[]} jerarquia
     * @returns {Permiso}
     */
    usuario(jerarquia) {
      return new Promise((resolve, reject) => {
        return permisoModel.aggregate(
          [
            { $match: { usuario: { $in: jerarquia } } },
            { $sort: { rol: 1 } },
            { $limit: 1 },
            { $project: { permisos: 1, _id: 1 } },
          ],
          (error, permisos) => {
            if (error) return reject(error.message);
            if (permisos) resolve(permisos[0]);
            else resolve(permisos);
          }
        );
      });
    },
  },
};
