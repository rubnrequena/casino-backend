class Caja {
  /** @type {String} */_id
  /** @type {String} */usuario
  /** @type {String} */fecha
  /** @type {ReporteCaja[]} */reportes
}

class ReporteCaja {
  /** @type {String} */sorteo
  /** @type {String} */operadora
  /** @type {Number} */monto
  /** @type {Number} */premio
  /** @type {Number} */pagado
  /** @type {Number} */tickets
}

module.exports = Caja