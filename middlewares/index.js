const { crearError } = require("../utils/error-util");

module.exports = {
  /**
   * @param {String} campos
   */
  validarPOST(campos) {
    let camposDatos = campos.split(",").map((campo) => {
      const llaveValor = campo.split(":");
      return {
        llave: llaveValor[0],
        valor: llaveValor[1] || "any",
      };
    });
    return function (/** @type {import("express").Request} */ req, res, next) {
      let errors = [];
      for (let i = 0; i < camposDatos.length; i++) {
        const campo = camposDatos[i];
        if (campo.llave in req.body) {
          const valor = req.body[campo.llave];
          if (!validar(valor, campo.valor))
            errors.push(
              `se esperaba '${campo.llave}' fuera de tipo '${campo.valor}'`
            );
        } else errors.push(`campo "${campo.llave}" no encontrado`);
      }
      if (errors.length == 0) next();
      else res.json(crearError(errors));
    };
  },
  /**
   * @param {String} campos
   */
  validarGET(campos) {
    let camposDatos = campos.split(",").map((campo) => {
      const llaveValor = campo.split(":");
      return {
        llave: llaveValor[0],
        valor: llaveValor[1] || "any",
      };
    });
    return function (/** @type {import("express").Request} */ req, res, next) {
      let errors = [];
      for (let i = 0; i < camposDatos.length; i++) {
        const campo = camposDatos[i];
        if (campo.llave in req.query) {
          const valor = req.query[campo.llave];
          if (!validar(valor, campo.valor))
            errors.push(
              `se esperaba '${campo.llave}' fuera de tipo '${campo.valor}'`
            );
        } else errors.push(`campo "${campo.llave}" no encontrado`);
      }
      if (errors.length == 0) next();
      else res.json(crearError(errors));
    };
  },
  /**
   * @param {String} permisos
   */
  validarPermisos(permisos) {
    return function (/** @type {import("express").Request} */ req, res, next) {
      if (req.permisos.indexOf(permisos) > -1) next();
      else
        res.status(401).send({
          error: "No tiene los permisos requeridos para ejecutar esta funcion",
        });
    };
  },
};
/**
 * @param {*} valor
 * @param {String} type
 */
function validar(valor, type) {
  if (type == "string") return validarString(valor);
  else if (type == "number") return validarNumber(valor);
  else if (type == "boolean") return validarBoolean(valor);
  else if (type == "objectid") return validarObjectId(valor);
  else if (type == "array" || type == "[]") return validarArreglo(valor);
  return true;
}
function validarString(str) {
  return typeof str == "string";
}

function validarNumber(num) {
  return /^\d+(\.\d+)*$/.test(num);
}

function validarArreglo(arr) {
  return Array.isArray(arr);
}

function validarObjectId(str) {
  return /^[a-f\d]{24}$/i.test(str);
}

function validarBoolean(bool) {
  return typeof bool == "boolean";
}
