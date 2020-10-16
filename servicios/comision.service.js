const comisionRepo = require("../repositorio/comision.repo");
const operadoraRepo = require("../repositorio/operadora-repo");

module.exports = {
  /**
   *
   * @param {Usuario} usuarioId
   * @param {String} operadoraId
   * @param {Number} comision
   * @param {Number} participacion
   * @param {Number} utilidad
   */
  async registrar(usuarioId, operadoraId, comision, participacion, utilidad) {
    const operadora = await operadoraRepo.buscar.id(operadoraId);
    if (!operadora) throw `Operadora ${operadoraId} no existe`;
    return comisionRepo.registrar(
      usuarioId,
      operadoraId,
      comision,
      participacion,
      utilidad
    );
  },
  modificar(comisionId, comision) {
    return comisionRepo.modificar(comisionId, comision);
  },
  remover(comisionId) {
    return comisionRepo.remover(comisionId);
  },
};
