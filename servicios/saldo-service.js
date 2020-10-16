const Saldo = require("../dto/saldo-dto");
const Usuario = require("../dto/usuario-dto");
const MetodoPago = require("../dto/metodo_pago-dto");
const saldoRepo = require("../repositorio/saldo-repo");
const Transaccion = require("../dto/transaccion-dto");
const usuarioRepo = require("../repositorio/usuario-repo");

/**
 * @param {Usuario} usuario
 * @param {String} descripcion
 * @param {Number} monto
 * @returns {Promise<Saldo>}
 */
function acreditar(usuario, descripcion, monto) {
  return saldoRepo.acreditar(usuario, descripcion, monto);
}
/**
 * @param {Usuario} usuario
 * @param {String} descripcion
 * @param {Number} monto
 * @returns {Promise<Saldo>}
 */
function debitar(usuario, descripcion, monto) {
  return saldoRepo.debitar(usuario, descripcion, monto);
}

module.exports = {
  acreditar,
  debitar,
  /**
   * @param {String} usuarioId
   * @returns {Saldo}
   */
  rollback(usuario, saldo) {
    return saldoRepo.rollback(usuario, saldo);
  },
  /**
   * @param {Usuario} usuario
   * @param {Number} monto
   * @param {String} metodoId
   * @param {String} mensaje
   */
  async recarga(usuario, monto, metodoId, fecha, recibo, mensaje) {
    const metodo = await saldoRepo.metodo_pago.buscar.id(metodoId);
    if (!metodo) throw `Metodo '${metodoId} inválido`;
    return saldoRepo.transaccion.recarga(
      usuario,
      monto,
      metodoId,
      metodo.moneda,
      fecha,
      recibo,
      mensaje
    );
  },
  /**d
   * @param {Usuario} usuario
   * @param {Number} monto
   * @param {String} metodoId
   * @param {String} mensaje
   */
  async retiro(usuario, monto, metodoId, mensaje) {
    const metodo = await saldoRepo.metodo_pago.buscar.id(metodoId);
    if (!metodoId) throw `Metodo '${metodoId} inválido`;
    return saldoRepo.transaccion.retiro(
      usuario,
      monto,
      metodoId,
      metodo.moneda,
      mensaje
    );
  },
  /**
   * @param {String} transaccionId
   * @param {String} padreId
   * @param {Usuario} usuario
   */
  procesar(transaccionId) {
    return new Promise(async (resolve, reject) => {
      const transaccion = await saldoRepo.transaccion.buscar.id(transaccionId);
      if (!transaccion) return reject("Transaccion no encontrada");
      if (!transaccion.metodo)
        return reject(
          "Imposible procesar transaccion: El metodo de pago asignado no existe"
        );
      const usuario = await usuarioRepo.buscar.id(transaccion.usuario);
      if (!usuario) return reject("Usuario no encontrado");
      return saldoRepo.transaccion
        .procesar(transaccion, usuario)
        .then((transaccion) => {
          if (transaccion.tipo == Transaccion.TIPO_RECARGA) {
            acreditar(
              usuario,
              `RECARGA DE SALDO`,
              transaccion.monto
            ).then((saldo) => resolve(saldo));
          } else if (transaccion.tipo == Transaccion.TIPO_RETIRO) {
            debitar(
              usuario,
              `RETIRO DE SALDO`,
              transaccion.monto
            ).then((saldo) => resolve(saldo));
          }
        })
        .catch((error) => reject(error));
    });
  },
  cancelar(transaccionId) {
    return new Promise(async (resolve, reject) => {
      const transaccion = await saldoRepo.transaccion.buscar.id(transaccionId);
      saldoRepo.transaccion
        .cancelar(transaccionId)
        .then(async (result) => {
          const usuario = await usuarioRepo.buscar.id(transaccion.usuario);
          await acreditar(
            usuario,
            "REEMBOLSO POR CANCELACION DE RETIRO",
            transaccion.monto
          );
          transaccion.cancelada = true;
          resolve(transaccion);
        })
        .catch((error) => reject(error));
    });
  },
  metodo_pago: {
    /**
     * @param {Usuario} usuario
     * @param {String} entidad
     * @param {String} direccion
     * @param {String} moneda
     * @param {String} meta
     * @returns {Promise<MetodoPago>}
     */
    nuevo(usuario, entidad, direccion, moneda, meta) {
      if (usuario.rol == Usuario.ONLINE) moneda = usuario.moneda[0].siglas;
      return saldoRepo.metodo_pago.nuevo(
        usuario,
        entidad,
        direccion,
        moneda,
        meta
      );
    },
    /**
     * @param {String} metodoId
     * @param {String} usuarioId
     */
    remover(metodoId, usuarioId) {
      return saldoRepo.metodo_pago.remover(metodoId, usuarioId);
    },
  },
};
