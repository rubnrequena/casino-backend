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
      while (finicio < ffinal) {
        rangoFechas.push(
          sorteoRepo.registrar(finicio.toISOString().substr(0, 10), operadora)
        );
        finicio.setDate(finicio.getDate() + 1);
      }
      Promise.race(rangoFechas).then((result) => {
        resolve(result);
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
      let sorteo = await sorteoRepo.buscar.id(sorteoId);
      if (sorteo.ganador) return reject("sorteo ya premiado");
      await sorteoModel.updateOne(
        {
          _id: sorteoId,
        },
        {
          ganador,
        },
        (error) => {
          if (error) console.log("notificar error");
        }
      );
      let operadora = await operadoraRepo.buscar.id(sorteo.operadora);
      let premiados = await ticketRepo.buscar.premiados(
        sorteoId,
        ganador,
        operadora.paga
      );

      if (premiados.length == 0) return reject("sin ventas registradas");

      let jugadoGlobal = 0;
      let numeroGlobal = 0;
      let premioGlobal = 0;
      let numJugadas = 0;
      let hoy = new Date();
      let reportes = [];
      const comisiones = await comisionRepo.buscar.operadora(
        operadora._id,
        Comision.COMISION
      );
      const participaciones = await comisionRepo.buscar.operadora(
        operadora._id,
        Comision.PARTICIPACION
      );
      for (let i = 0; i < premiados.length; i++) {
        const premiado = premiados[i];
        const taquilla = await usuarioRepo.buscar.id(premiado._id);
        const comercial = await usuarioRepo.buscar.id(taquilla.jerarquia[1]);
        const banca = await usuarioRepo.buscar.id(taquilla.jerarquia[2]);
        const grupo = await usuarioRepo.buscar.id(taquilla.jerarquia[3]);
        const agencia = await usuarioRepo.buscar.id(taquilla.jerarquia[4]);
        jugadoGlobal += premiado.venta;
        premioGlobal += premiado.premio;
        numJugadas += premiado.numTickets;

        /** @type {Reporte} */
        let reporte = {
          usuario: premiado._id,
          fecha: hoy,
          operadora: operadora._id,
          sorteo: sorteo._id,
          venta: premiado.venta,
          premio: premiado.premio,
          numTickets: premiado.numTickets,
          jerarquia: taquilla.jerarquia,
          comision: {
            taquilla: buscarComision(taquilla, comisiones),
            agencia: buscarComision(agencia, comisiones),
            grupo: buscarComision(grupo, comisiones),
            banca: buscarComision(banca, comisiones),
            comercial: buscarComision(comercial, comisiones),
          },
          participacion: {
            agencia: buscarParticipacion(taquilla, participaciones),
            grupo: buscarParticipacion(taquilla, participaciones),
            banca: buscarParticipacion(taquilla, participaciones),
            comercial: buscarParticipacion(taquilla, participaciones),
          },
        };
        reportes.push(reporte);
      }
      //TODO enviar a reporteRepo.nuevo
      reporteModel.collection.insertMany(reportes, (error, result) => {
        if (error) console.log("error :>> ", error);
      });
      //ticketRepo.ventasPremiadas(sorteoId, ganador, operadora.paga);

      //Marcar tickets premiados
      ventaModel.updateMany(
        { sorteo: sorteoId, numero: ganador },
        { premio: true },
        (error, result) => {
          console.log("tickets premiados", result);
        }
      );
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
      //#endregion

      resolve({
        jugadoGlobal,
        premioGlobal,
        numJugadas,
        saldoOnline,
      });
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
    fecha(desde, hasta) {
      return sorteoRepo.buscar.fecha(desde, hasta);
    },
    /**
     * @param {Usuario} usuario
     * @param {String} fecha
     * @returns {Promise<Sorteo[]>}
     */
    disponibles(usuario, fecha) {
      return new Promise(async (resolve) => {
        let enlaces;
        let usuarios = [...usuario.jerarquia, usuario._id];
        for (let i = usuarios.length - 1; i > 0; i--) {
          const usuarioId = usuarios[i];
          enlaces = await sorteoRepo.buscar.disponibles(usuarioId);
          if (enlaces && enlaces.length > 0) break;
        }
        if (!enlaces || enlaces.length == 0)
          return resolve({ sorteos: [], operadoras: [] });
        enlaces = enlaces.filter((enlace) => enlace.mostrar == true);
        const sorteos = await sorteoRepo.buscar.operadoras(enlaces, fecha);
        resolve(sorteos);
      });
    },
  },
};

/**
 * @param {Usuario} usuario
 * @param {Comision[]} data
 * @returns {Number}
 */
function buscarComision(usuario, data) {
  if (!usuario) return 0;
  let comision = data.find((comision) => comision.usuario == usuario._id);
  return comision ? comision.comision : usuario.comision;
}

/**
 * @param {Usuario} usuario
 * @param {Comision[]} data
 * @returns {Number}
 */
function buscarParticipacion(usuario, data) {
  if (!usuario) return 0;
  let comision = data.find((comision) => comision.usuario == usuario._id);
  return comision ? comision.comision : usuario.participacion;
}
