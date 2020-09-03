const numerosModel = require("_modelos/numeros-model");
const Numero = require("../dto/numero-dto");

module.exports = {
  /**
   * @param {String[]} numerosIds
   * @return {Promise<Numero>}
   */
  numeros_operadoras(numerosIds) {
    return new Promise((resolve, reject) => {
      numerosModel.aggregate(
        [{ $match: { _id: { $in: numerosIds } } }],
        (error, numeros) => {
          if (error) return reject(error.message);
          resolve(numeros);
        }
      );
    });
  },
};
