const comisionRepo = require("../repositorio/comision.repo");

module.exports = {
  registrar_comision(comision, usuarioId, operadoraId) {
    return comisionRepo.registrar_comision(comision, usuarioId, operadoraId);
  },
  registrar_participacion(usuarioId, comision, operadoraId) {
    return comisionRepo.registrar_participacion(
      usuarioId,
      comision,
      operadoraId
    );
  },
  modificar(comisionId, comision) {
    return comisionRepo.modificar(comisionId, comision);
  },
  remover(comisionId) {
    return comisionRepo.remover(comisionId);
  },
};
