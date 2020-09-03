class Permiso {
  static operadora = {
    leer: "operadora1",
    crear: "operadora2",
    edita: "operadora3",
    elimina: "operadora4",
  };
  static sorteos = {
    leer: "sorteos1",
    crear: "sorteos2",
    edita: "sorteos3",
    elimina: "sorteos4",
    premia: "sorteos_prm",
  };
  static permisos = {
    leer: "permisos1",
    crear: "permisos2",
    edita: "permisos3",
    elimina: "permisos4",
  };
  static ventas = {
    leer: "ventas1",
    anular: "ventas2",
  };
  static saldos = {
    leer: "saldo1",
    recarga: "saldo2",
    retiro: "saldo3",
    historia: "saldo4",
  };
  static usuarios = {
    leer: "usuario1",
    crear: "usuario2",
    edita: "usuario3",
    elimina: "usuario4",
    crear_online: "usuario5",
  };
  static cupos = {
    leer: "cupos1",
    crear: "cupos2",
    edita: "cupos3",
    elimina: "cupos4",
  };
  static master() {
    const _permisos = [
      Permiso.operadora,
      Permiso.sorteos,
      Permiso.permisos,
      Permiso.ventas,
      Permiso.saldos,
      Permiso.usuarios,
      Permiso.cupos,
    ];
    return this.batchPermisos(_permisos);
  }
  static admin() {
    const _permisos = [
      Permiso.ventas,
      Permiso.usuarios,
      Permiso.cupos,
      Permiso.sorteos,
    ];
    return this.batchPermisos(_permisos);
  }
  static agente() {
    const _permisos = [
      Permiso.ventas,
      Permiso.usuarios,
      Permiso.cupos,
      Permiso.sorteos,
      Permiso.saldos,
    ];
    return this.batchPermisos(_permisos);
  }

  static batchPermisos(permisos) {
    let prm = [];
    const a = permisos.map((permiso) => {
      for (const campo in permiso) {
        if (permiso.hasOwnProperty(campo)) {
          const element = permiso[campo];
          prm.push(element);
        }
      }
    });
    return prm;
  }
}
module.exports = Permiso;
