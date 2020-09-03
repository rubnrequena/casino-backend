const NIVELES = ['operadora', 'multi', 'banca', 'grupo', 'agencia', 'taquilla']

class Tope {
  /**
   * @param {String} rol 
   * @returns {Number} nivel del tope
   */
  static buscarNivel = (rol) => {
    return NIVELES.indexOf(rol)
  }
  /** @type {String} */
  _id
  /** @type {String} */
  usuario
  /** @type {Number} */
  monto
  /** @type {String} */
  nivel
  /** @type {Boolean} */
  activo
  /** @type {String} */
  operadora
  /** @type {String} */
  sorteo
  /** @type {String} */
  numero
  /** @type {Number} */
  orden
}
module.exports = Tope