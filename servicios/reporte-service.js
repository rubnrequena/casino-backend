const Reporte = require("../dto/reporte-dto");
const Usuario = require("../dto/usuario-dto");
const operadoraRepo = require("../repositorio/operadora-repo");
const reporteRepo = require("../repositorio/reporte-repo");
const usuarioRepo = require("../repositorio/usuario-repo");

module.exports = {
  buscar: {
    /**
     * @param {Usuario} usuario
     * @param {String} desde
     * @param {String} hasta
     */
    async usuario(usuario, desde, hasta) {
      let operadoras = await operadoraRepo.buscar.enlacesUsuario(usuario._id);
      if (usuario.rol == Usuario.AUDITOR)
        usuario = await usuarioRepo.buscar.usuario("master");
      return reporteRepo.buscar.usuario(usuario._id, operadoras, desde, hasta);
    },
    async operadoras(usuario, desde, hasta) {
      let operadoras = await operadoraRepo.buscar.enlacesUsuario(usuario._id);
      if (usuario.rol == Usuario.AUDITOR)
        usuario = await usuarioRepo.buscar.usuario("master");
      return reporteRepo.buscar.operadoras(
        usuario._id,
        operadoras,
        desde,
        hasta
      );
    },
    negativos: {
      /**
       * @param {Usuario} usuario
       * @param {String} desde
       * @param {String} hasta
       */
      async usuario(usuario, desde, hasta) {
        let operadoras = await operadoraRepo.buscar.enlacesUsuario(usuario._id);
        if (usuario.rol == Usuario.AUDITOR)
          usuario = await usuarioRepo.buscar.usuario("master");
        return reporteRepo.buscar.negativos.usuario(
          usuario._id,
          operadoras,
          desde,
          hasta
        );
      },
    },
  },
};
