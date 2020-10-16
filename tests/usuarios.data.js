const Usuario = require("../dto/usuario-dto");

const usuarios = {
  comerciales: [
    {
      padre: "master",
      usuario: "comercial",
      clave: "1234",
      moneda: "ves,usd,eur",
      nombre: "Comercial",
      correo: "c@gmail.com",
      telefono: "04149970167",
      rol: Usuario.MULTI,
      permisos: "5f404c2399166318ec20c306",
    },
    {
      padre: "master",
      usuario: "agente",
      clave: "1234",
      moneda: "ves,usd,eur",
      nombre: "Agente",
      correo: "ag@gmail.com",
      telefono: "04149970167",
      rol: Usuario.AGENTE,
      permisos: "5f404c2399166318ec20c308",
    },
  ],
  bancas: [
    {
      padre: "comercial",
      usuario: "banca",
      clave: "1234",
      moneda: "ves,usd,eur",
      nombre: "Banca",
      correo: "banca@gmail.com",
      telefono: "04149970167",
      rol: "banca",
      permisos: "5f404c2399166318ec20c306",
    },
  ],
  grupos: [
    {
      padre: "banca",
      usuario: "grupo",
      clave: "1234",
      moneda: "ves,usd,eur",
      nombre: "Grupo",
      correo: "grupo@gmail.com",
      telefono: "04149970167",
      rol: "grupo",
      permisos: "5f404c2399166318ec20c306",
    },
  ],
  agencias: [
    {
      padre: "grupo",
      usuario: "agencia",
      clave: "1234",
      moneda: "ves,usd,eur",
      nombre: "Agencia",
      correo: "agencia@gmail.com",
      telefono: "04149970167",
      rol: "agencia",
      permisos: "5f404c2399166318ec20c306",
    },
  ],
  pos: [
    {
      padre: "agencia",
      usuario: "pos1",
      clave: "1234",
      moneda: "ves",
      nombre: "POS 1",
      correo: "pos1@gmail.com",
      telefono: "04149970167",
      rol: "taquilla",
    },
    {
      padre: "agencia",
      usuario: "pos2",
      clave: "1234",
      moneda: "ves",
      nombre: "POS 2",
      correo: "pos2@gmail.com",
      telefono: "04149970167",
      rol: "taquilla",
    },
    {
      padre: "agencia",
      usuario: "pos3",
      clave: "1234",
      moneda: "ves",
      nombre: "POS 3",
      correo: "pos3@gmail.com",
      telefono: "04149970167",
      rol: "taquilla",
    },
    {
      padre: "agencia",
      usuario: "pos4",
      clave: "1234",
      moneda: "ves",
      nombre: "POS 4",
      correo: "pos4@gmail.com",
      telefono: "04149970167",
      rol: "taquilla",
    },
    {
      padre: "agencia",
      usuario: "pos5",
      clave: "1234",
      moneda: "ves",
      nombre: "POS 5",
      correo: "pos5@gmail.com",
      telefono: "04149970167",
      rol: "taquilla",
    },
    {
      padre: "agente",
      usuario: "online1",
      clave: "1234",
      moneda: "ves",
      nombre: "ONLINE 1",
      correo: "online1@gmail.com",
      telefono: "04149970167",
      rol: "online",
    },
  ],
};

module.exports = {
  usuarios,
  /**
   * @param {String} rol
   * @param {String} usuarioPadre
   * @return {Usuario[]}
   */
  hijos: (rol, usuarioPadre) => {
    const _usuarios = usuarios[rol];
    return _usuarios.reduce((hijos, hijo) => {
      if (hijo.padre == usuarioPadre) hijos.push(hijo);
      return hijos;
    }, []);
  },
};
