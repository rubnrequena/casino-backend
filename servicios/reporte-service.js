const Reporte = require("../dto/reporte-dto");
const Usuario = require("../dto/usuario-dto");
const operadoraRepo = require("../repositorio/operadora-repo");
const reporteRepo = require("../repositorio/reporte-repo");
const usuarioRepo = require("../repositorio/usuario-repo");

/**
 * 
 * @param {Usuario} usuario 
 * @param {String} fecha 
 */
function caja_generar(usuario, fecha) {
  return reporteRepo.caja.generar(usuario._id, fecha, usuario.grupoPago).then(reportes => {
    return reporteRepo.caja.nuevo(usuario._id, reportes).then((reporte) => {
      return reporte;
    }).catch(error => error)
  }).catch(error => error)
}
/**
 * @param {Usuario} usuario 
 * @param {String} fecha 
 */
function caja_buscar(usuario, fecha) {
  return reporteRepo.caja.buscar(usuario._id, fecha)
}

module.exports = {
  buscar: {
    /**
     * @param {Usuario} usuario
     * @param {String} desde
     * @param {String} hasta
     */
    async usuario(usuario, desde, hasta, moneda) {
      let operadoras = null;
      if (usuario.rol == Usuario.AUDITOR) {
        usuario = await usuarioRepo.buscar.usuario("master");
        operadoras = await operadoraRepo.buscar.enlacesUsuario(usuario);
        operadoras = operadoras.map((operadora) => operadora.operadora);
      }
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
      let operadoras;
      if (usuario.rol == Usuario.AUDITOR) {
        usuario = await usuarioRepo.buscar.usuario("master");
        operadoras = await operadoraRepo.buscar.enlacesUsuario(usuario);
        operadoras = operadoras.map((operadora) => operadora.operadora);
      }
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
      let operadoras = await operadoraRepo.buscar.enlacesUsuario(usuario);
      const enlace = operadoras.find(
        (op) => op.operadora.toString() == operadora
      );

      if (usuario.rol == Usuario.AUDITOR)
        usuario = await usuarioRepo.buscar.usuario("master");
      return await reporteRepo.buscar.sorteos(
        usuario._id,
        usuario.rol,
        enlace.operadora,
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
        let operadoras = await operadoraRepo.buscar.enlacesUsuario(usuario);
        operadoras = operadoras.map((operadora) => operadora.operadora);
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
  caja: {
    generar: caja_generar,
    buscar: caja_buscar
  }
};
