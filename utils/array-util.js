module.exports = {
  /**JSDoc
   * @param {Array} datos
   * @param {*} valor
   * @param {Function} validacionFnc
   * @returns {Boolean}
   */
  async validar(datos, valor, validacionFnc) {
    for (let i = 0; i < datos.length; i++) {
      if ((await validacionFnc(datos[i])) != valor) return false;
    }
    return true;
  },

  /**
   *
   * @param {Array} datos
   * @param {Function} func
   */
  async syncForEach(datos, func) {
    for (let indice = 0; indice < datos.length; indice++) {
      datos[indice] = await func(datos[indice], indice);
    }
    return datos;
  },
};
