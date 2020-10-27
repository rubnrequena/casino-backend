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
    async usuario(usuario, desde, hasta, moneda) {
      let operadoras = await operadoraRepo.buscar.enlacesUsuario(usuario._id);
      if (usuario.rol == Usuario.AUDITOR)
        usuario = await usuarioRepo.buscar.usuario("master");
      return reporteRepo.buscar.usuario(
        usuario._id,
        usuario.rol,
        operadoras,
        desde,
        hasta,
        moneda
      );
    },
    /**
     * @param {Usuario} usuario
     * @param {String} desde
     * @param {String} hasta
     */
    async operadoras(usuario, desde, hasta, moneda) {
      let operadoras = await operadoraRepo.buscar.enlacesUsuario(usuario._id);
      if (usuario.rol == Usuario.AUDITOR)
        usuario = await usuarioRepo.buscar.usuario("master");
      return await reporteRepo.buscar.operadoras(
        usuario._id,
        usuario.rol,
        operadoras,
        desde,
        hasta,
        moneda
      );
    },
    /**
     * @param {Usuario} usuario
     * @param {Operadora} operadora
     * @param {String} desde
     * @param {String} hasta
     */
    async sorteos(usuario, operadora, desde, hasta, moneda) {
      let operadoras = await operadoraRepo.buscar.enlacesUsuario(usuario._id);
      operadoras = operadoras.filter((op) => {
        const id = op.operadora._id.toString();
        return id == operadora;
      });
      if (usuario.rol == Usuario.AUDITOR)
        usuario = await usuarioRepo.buscar.usuario("master");
      return await reporteRepo.buscar.sorteos(
        usuario._id,
        usuario.rol,
        operadoras,
        desde,
        hasta,
        moneda
      );
    },
    async loterias(usuario, desde, hasta, moneda) {
      //let operadoras = await operadoraRepo.buscar.enlacesUsuario(usuario._id);
      if (usuario.rol == Usuario.AUDITOR)
        usuario = await usuarioRepo.buscar.usuario("master");
      return await reporteRepo.buscar.loterias(
        usuario.rol,
        desde,
        hasta,
        moneda
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
          usuario.rol,
          operadoras,
          desde,
          hasta
        );
      },
    },
  },
};
