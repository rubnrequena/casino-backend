class Permiso {
  /** @type {String} */ _id;
  /** @type {Number[]} */ permisos;
  /** @type {String} */ nombre;
  /** @type {String} */ usuario;

  static operadora = {
    leer: 10,
    modificar: 11,
  };
  static sorteos = {
    leer: 20,
    modificar: 21,
    registro: 22,
    premia: 23,
  };
  static permisos = {
    leer: 30,
    modificar: 31,
  };
  static ventas = {
    leer: 60,
    anular: 61,
  };
  static saldos = {
    leer: 70,
    recarga: 71,
    retiro: 72,
  };
  static usuarios = {
    leer: 50,
    modificar: 51,
    crear_online: 52,
  };
  static cupos = {
    leer: 40,
    modificar: 41,
  };
}
module.exports = Permiso;
