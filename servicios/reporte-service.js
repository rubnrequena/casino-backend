const Reporte = require("../dto/reporte-dto");
const Usuario = require("../dto/usuario-dto");
const operadoraRepo = require("../repositorio/operadora-repo");
const reporteRepo = require("../repositorio/reporte-repo");
const usuarioRepo = require("../repositorio/usuario-repo");
const axios = require("axios").default;

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
    /**
     *
     * @param {Usuario} usuario
     * @param {String} desde
     * @param {String} hasta
     */
    async operadoras(usuario, desde, hasta) {
      let meta = await usuarioRepo.meta(usuario._id);
      let operadoras = await operadoraRepo.buscar.enlacesUsuario(usuario._id);
      if (usuario.rol == Usuario.AUDITOR)
        usuario = await usuarioRepo.buscar.usuario("master");

      let otros_reportes = [];
      if (meta.operadoras_remotas) {
        let url = String(meta.operadoras_remotas.srq);
        url = url.replace(":inicio", desde);
        url = url.replace(":fin", hasta);
        result = await axios.get(url);
        otros_reportes = result.data.map((reporte) => {
          reporte.operadora = { nombre: reporte.operadora };
          reporte.subtotal = reporte.venta - reporte.premio - reporte.comision;
          reporte.total = reporte.subtotal - reporte.participacion;
          reporte.tickets = 0;
          reporte.sistema = "srq";
          return reporte;
        });
      }
      const reporte = await reporteRepo.buscar.operadoras(
        usuario._id,
        operadoras,
        desde,
        hasta
      );
      return [...reporte, ...otros_reportes];
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
