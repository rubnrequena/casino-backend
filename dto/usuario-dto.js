class Usuario {
  static MASTER = "master";
  static OPERADORA = "operadora";
  static MULTI = "multi";
  static BANCA = "banca";
  static GRUPO = "grupo";
  static AGENCIA = "agencia";
  static TAQUILLA = "taquilla";
  static ONLINE = "online";
  static AGENTE = "agente";
  static AUDITOR = "auditor";

  static NIVELES = [
    this.MASTER,
    this.MULTI,
    this.BANCA,
    this.GRUPO,
    this.AGENCIA,
    this.TAQUILLA,
    this.AGENTE,
    this.ONLINE,
  ];

  static NIVELES_ONLINE = [this.MASTER, this.AGENTE, this.ONLINE];

  static rolHeradado(rolPadre) {
    let padreIndice = this.NIVELES.indexOf(rolPadre);
    if (padreIndice > -1) return this.NIVELES[padreIndice + 1];
    return null;
  }

  /** @type {String} */ _id;
  /** @type {String} */ usuario;
  /** @type {String} */ clave;
  /** @type {String} */ nombre;
  /** @type {String} */ padre;
  /** @type {Date} */ creado;
  /** @type {String} */ correo;
  /** @type {String} */ telefono;
  /** @type {String} */ rol;
  /** @type {Boolean} */ activo;
  /** @type {Boolean} */ papelera;
  /** @type {String[]} */ jerarquia;
  /** @type {Number} */ comision;
  /** @type {Number} */ participacion;
  /** @type {String} */ moneda;
  /** @type {String} */ permisos;
  /** @type {String} */ menu;
  /** @type {String} */ codigo;
  /** @type {Object} */ meta;
  /** @type {String} */ grupoPago;
}

module.exports = Usuario;
