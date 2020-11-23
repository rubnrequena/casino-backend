const sorteoRepo = require("../repositorio/sorteo-repo");
const ticketRepo = require("../repositorio/ticket-repo");
const usuarioRepo = require("../repositorio/usuario-repo");
const operadoraRepo = require("../repositorio/operadora-repo");
const reporteRepo = require("../repositorio/reporte-repo");

const Sorteo = require("../dto/sorteo-dto");
const Reporte = require("../dto/reporte-dto");
const Usuario = require("../dto/usuario-dto");

const reporteModel = require("_modelos/reporte-model");
const sorteoModel = require("_modelos/sorteo-model");
const sorteoUtil = require("../utils/sorteo-util");
const comisionRepo = require("../repositorio/comision.repo");
const Comision = require("../dto/comision.dto");
const ventaModel = require("_modelos/venta-model");
const saldoService = require("./saldo-service");
const { util } = require("chai");

var total = 0;

module.exports = {
  /** JSDoc
   * @param {String} desde
   * @param {String} hasta
   * @param {String} operadora
   * @returns {Promise<Sorteo>}
   */
  registrar(desde, hasta, operadora) {
    return new Promise(async (resolve, reject) => {
      let finicio = new Date(desde);
      let ffinal = new Date(hasta);
      ffinal.setHours(23, 59);
      let rangoFechas = [];
      let fecha;
      while (finicio < ffinal) {
        fecha = finicio.toISOString().substr(0, 10);
        let existe = await sorteoRepo.buscar.registrado(fecha, operadora);
        if (!existe) rangoFechas.push(sorteoRepo.registrar(fecha, operadora));
        finicio.setDate(finicio.getDate() + 1);
      }
      Promise.race(rangoFechas)
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          console.log(
            "Ocurrio un error mientras se registraban los sorteos",
            error
          );
          //TODO: notificar error
        });
    });
  },
  abrir(sorteoId) {
    return sorteoRepo.abrir(sorteoId);
  },
  cerrar(sorteoId) {
    return sorteoRepo.cerrar(sorteoId);
  },
  async estaAbierto(sorteoId) {
    const sorteo = await sorteoRepo.buscar.id(sorteoId);
    return sorteoUtil.estaAbierto(sorteo);
  },
  /**
   * @param {String} sorteoId
   * @param {String} ganador
   */
  premiar(sorteoId, ganador) {
    return new Promise(async (resolve, reject) => {
      const sorteo = await sorteoRepo.buscar.id(sorteoId);
      if (sorteo.ganador) return reject("sorteo ya premiado");
      await sorteoModel.updateOne({ _id: sorteoId }, { ganador }, (error) => {
        if (error) console.log("notificar error");
      });
      const operadora = await operadoraRepo.buscar.id(sorteo.operadora);
      const premiados = await ticketRepo.buscar.premiados(
        sorteoId,
        ganador,
        operadora.paga
      );
      if (premiados.length == 0) return reject("sin ventas registradas");

      let jugadoGlobal = 0;
      let premioGlobal = 0;
      let numJugadas = 0;
      let reportes = [];
      const hoy = new Date();
      const comisiones = await comisionRepo.buscar.operadora(operadora._id);
      for (let i = 0; i < premiados.length; i++) {
        const premiado = premiados[i];
        //TODO: optimizar
        const pos = await usuarioRepo.buscar.id(premiado._id);
        jugadoGlobal += premiado.venta;
        premioGlobal += premiado.premio;
        numJugadas += premiado.numTickets;

        /** @type {Reporte} */
        let reporte = {
          usuario: premiado._id,
          fecha: hoy,
          operadora: operadora._id,
          sorteo: sorteo._id,
          moneda: premiado.moneda,
          venta: premiado.venta,
          premio: premiado.premio,
          numTickets: premiado.numTickets,
          jerarquia: pos.jerarquia,
        };
        const comisionPadres = await generarComision(pos.jerarquia, comisiones);
        reporte = { ...reporte, ...comisionPadres };

        const posComision = buscarComision(pos, comisiones);
        reporte.comision[pos.rol] = posComision.comision;
        reporte.participacion[pos.rol] = posComision.participacion;

        reportes.push(reporte);
      }
      //TODO enviar a reporteRepo.nuevo
      reporteModel.collection.insertMany(reportes, (error, result) => {
        if (error) console.log("error :>> ", error);
      });
      //ticketRepo.ventasPremiadas(sorteoId, ganador, operadora.paga);

      //Marcar tickets premiados
      ticketRepo.ventas.marcarPremiados(sorteoId, ganador);
      resolve({
        jugadoGlobal,
        premioGlobal,
        numJugadas,
      });
      //#region Pagar saldo
      let saldoOnline = 0;
      const ventas = await ventaModel
        .find({ sorteo: sorteoId, numero: ganador, online: true })
        .populate("ticketId", "serial")
        .populate("sorteo", "descripcion")
        .lean();
      for (let i = 0; i < ventas.length; i++) {
        const venta = ventas[i];
        const saldo = venta.monto * operadora.paga;
        saldoOnline += saldo;
        await saldoService.acreditar(
          venta.usuario,
          `TICKET GANADOR #${venta.ticketId.serial} SORTEO ${sorteo.descripcion}`,
          saldo
        );
      }
      console.log("saldo actualizado, saldo reducido en", saldoOnline);
      //#endregion
    });
  },
  reiniciar(sorteoId) {
    return new Promise((resolve, reject) => {
      Promise.all([
        sorteoRepo.reiniciar(sorteoId),
        reporteRepo.reiniciar(sorteoId),
      ]).then(
        (result) => resolve(result),
        (error) => reject(error)
      );
    });
  },
  buscar: {
    /**
     * @param {String} fecha 
     * @param {String} operadoraId 
     */
    fecha(fecha, operadoraId) {
      return sorteoRepo.buscar.fecha(fecha, operadoraId);
    },
    /**
     * @param {Usuario} usuario
     * @param {String} fecha
     * @returns {Promise<Sorteo[]>}
     */
    disponibles(usuario, fecha) {
      return new Promise(async (resolve) => {
        let jerarquia = [...usuario.jerarquia, usuario._id];
        sorteoRepo.buscar
          .disponibleEnlaces(fecha, jerarquia)
          .then((sorteos) => {
            resolve(sorteos);
          });
      });
    },
  },
};

/**
 * @param {Usuario} usuario
 * @param {Comision[]} data
 * @returns {Comision}
 */
function buscarComision(usuario, data) {
  return data.find((comision) => {
    return comision.usuario.equals(usuario._id);
  });
}
async function generarComision(jerarquia, comisiones) {
  let comision = {};
  let participacion = {};
  let utilidad = {};
  for (let i = 1; i < jerarquia.length; i++) {
    //TODO: optimizar
    total++;
    const usuario = await usuarioRepo.buscar.id(jerarquia[i]);
    const _comision = buscarComision(usuario, comisiones);
    comision[usuario.rol] = _comision.comision;
    participacion[usuario.rol] = _comision.participacion;
    utilidad[usuario.rol] = _comision.utilidad;
  }
  return { comision, participacion, utilidad };
}
