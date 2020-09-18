const operadoraRepo = require("../repositorio/operadora-repo");
const Operadora = require("../dto/operadora-dto");
const usuarioRepo = require("../repositorio/usuario-repo");
const sorteoRepo = require("../repositorio/sorteo-repo");
const topeUtil = require("../utils/tope-util");

module.exports = {
  /**
   * @param {String} nombre
   * @param {String} tipo
   * @param {Number} paga
   * @param {Array<String>} sorteos
   * @returns {Promise<Operadora>}
   */
  registro(nombre, tipo, paga, sorteos, numeros) {
    return operadoraRepo.guardar(nombre, tipo, paga, sorteos, numeros);
  },
  /**
   *
   * @param {String} usuarioId
   * @param {String[]} operadoraIds
   * @param {Boolean} mostrar
   */
  enlazar(usuarioId, operadoraIds, mostrar) {
    return new Promise(async (resolve, reject) => {
      const usuario = await usuarioRepo.buscar.id(usuarioId);
      if (!usuario) return reject(`usuario '${usuarioId}' no existe`);

      const nivel = topeUtil.calcularNivel(usuario.rol);
      const enlacesPrevios = await operadoraRepo.buscar.enlacesUsuario(
        usuarioId
      );

      const enlacePrevio = operadoraIds.find((operadoraId) => {
        return enlacesPrevios.find((enlace) => {
          return (
            enlace.operadora._id.toString() == operadoraId &&
            enlace.nivel == nivel
          );
        });
      });

      if (enlacePrevio) return reject("Error: Enlace duplicado");

      let cola = [];
      for (let i = 0; i < operadoraIds.length; i++) {
        const operadoraId = operadoraIds[i];
        const operadora = await operadoraRepo.buscar.id(operadoraId);
        if (!operadora) return reject(`operadora '${operadoraId}' no existe`);
        const jerarquia = [...usuario.jerarquia, usuario._id];
        cola.push(
          operadoraRepo.enlaceNuevo(jerarquia, operadora._id, mostrar, nivel)
        );
      }
      Promise.all(cola)
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  enlaceRemover(usuarioId, enlaceId) {
    return operadoraRepo.enlaceRemover(usuarioId, enlaceId);
  },
};
