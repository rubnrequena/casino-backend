const chalk = require("chalk");
const mongoose = require("mongoose");
const config = require("../config/index");

const Usuario = require("_modelos/usuario-model");
const DTOUsuario = require("../dto/usuario-dto");
const RedisCache = require("../dto/redis-cache.dto");
const md5 = require("md5");
const menuModel = require("_modelos/menu-model");
const redisRepo = require("../repositorio/redis-repo");
const permisoModel = require("../modelos/permiso-model");
const operadoraRepo = require("../repositorio/operadora-repo");
const saldoRepo = require("../repositorio/saldo-repo");
const monedaModel = require("_modelos/moneda-model");
const usuarioModel = require("_modelos/usuario-model");
const { syncForEach } = require("../utils/array-util");
const numerosModel = require("_modelos/numeros-model");
const rolModel = require("_modelos/rol-model");
const sys_permisoModel = require("_modelos/sys_permiso-model");
const Permiso = require("../dto/permiso.dto");
const usuarioRepo = require("../repositorio/usuario-repo");

let connection;

module.exports = {
  connection,
  conectar() {
    return new Promise((resolve, reject) => {
      console.log("conectando con:", config.databaseURL);
      connection = mongoose.connect(
        config.databaseURL,
        {
          useNewUrlParser: true,
          useCreateIndex: true,
          useUnifiedTopology: true,
          useFindAndModify: false,
        },
        async (err) => {
          if (err) return reject("Error al conectar con la base de datos");
          console.log(`Conectado exitosamente a, ${config.databaseURL}`);
          await initRedisCache();
          resolve();
        }
      );
    });
  },
  async verificarDatosIniciales() {
    const numAdmins = await Usuario.find({
      rol: DTOUsuario.MASTER,
    }).countDocuments();
    if (numAdmins == 0) crearAdmin();
  },
};

async function crearAdmin() {
  console.log("deprecated database.js");
}

async function initRedisCache() {
  const numUsuarios = await usuarioModel.countDocuments();
  if (numUsuarios == 0) {
    await new Usuario({
      usuario: "master",
      clave: md5("1234"),
      nombre: "Administrador",
      correo: "admin@fullapuestas.com",
      moneda: "ves,eur,usd",
      codigo: 0,
      permisos: "5f404c2399166318ec20c307",
      rol: "master",
    }).save((err) => {
      if (err) console.log(err);
      console.log("Un nuevo admin ha nacido");
    });
  }

  console.log("iniciando cache a redis");
  //#region Roles
  let _roles = await rolModel.find().lean();
  if (_roles.length == 0) {
    rolModel.insertMany([
      {
        nombre: "master",
        descripcion: "Usuarios Master",
        nivel: 100,
        grupo: ["admin", "master", "ventas", "online"],
      },
      {
        nombre: "conalot",
        descripcion: "CONALOT",
        nivel: 90,
        grupo: ["hijomaster", "ventas", "online"],
      },
      {
        nombre: "multi",
        descripcion: "Usuarios Comerciales",
        nivel: 50,
        grupo: ["hijomaster", "admin", "ventas"],
      },
      {
        nombre: "banca",
        descripcion: "Usuarios Banqueros",
        nivel: 40,
        grupo: ["admin", "ventas"],
      },
      {
        nombre: "grupo",
        descripcion: "Usuarios Grupos",
        nivel: 30,
        grupo: ["admin", "ventas"],
      },
      {
        nombre: "agencia",
        descripcion: "Usuarios Agencias",
        nivel: 20,
        grupo: ["admin", "ventas"],
      },
      {
        nombre: "taquilla",
        descripcion: "Usuarios Taquillas",
        nivel: 10,
        grupo: ["ventas"],
      },
      {
        nombre: "agente",
        descripcion: "Usuarios Agentes Online",
        nivel: 50,
        grupo: ["hijomaster", "online", "admin", "ventas"],
      },
      {
        nombre: "online",
        descripcion: "Usuarios Venta Online",
        nivel: 10,
        grupo: ["ventas", "online"],
      },
    ]);
  }
  //#endregion

  //#region numeros
  let numeros = await numerosModel.find().lean();
  if (numeros.length == 0) {
    let numero = await new numerosModel({
      nombre: "loteria animal",
      numeros: [
        { numero: "0", nombre: "DELFIN" },
        { numero: "00", nombre: "BALLENA" },
        { numero: "01", nombre: "CARNERO" },
        { numero: "02", nombre: "TORO" },
        { numero: "03", nombre: "CIEMPIES" },
        { numero: "04", nombre: "ALACRAN" },
        { numero: "05", nombre: "LEON" },
        { numero: "06", nombre: "RANA" },
        { numero: "07", nombre: "PERICO" },
        { numero: "08", nombre: "RATON" },
        { numero: "09", nombre: "AGUILA" },
        { numero: "10", nombre: "TIGRE" },
        { numero: "11", nombre: "GATO" },
        { numero: "12", nombre: "CABALLO" },
        { numero: "13", nombre: "MONO" },
        { numero: "14", nombre: "PALOMA" },
        { numero: "15", nombre: "ZORRO" },
        { numero: "16", nombre: "OSO" },
        { numero: "17", nombre: "PAVO" },
        { numero: "18", nombre: "BURRO" },
        { numero: "19", nombre: "CHIVO" },
        { numero: "20", nombre: "COCHINO" },
        { numero: "21", nombre: "GALLO" },
        { numero: "22", nombre: "CAMELLO" },
        { numero: "23", nombre: "ZEBRA" },
        { numero: "24", nombre: "IGUANA" },
        { numero: "25", nombre: "GALLINA" },
        { numero: "26", nombre: "VACA" },
        { numero: "27", nombre: "PERRO" },
        { numero: "28", nombre: "ZAMURO" },
        { numero: "29", nombre: "ELEFANTE" },
        { numero: "30", nombre: "CAIMAN" },
        { numero: "31", nombre: "LAPA" },
        { numero: "32", nombre: "ARDILLA" },
        { numero: "33", nombre: "PESCADO" },
        { numero: "34", nombre: "VENADO" },
        { numero: "35", nombre: "JIRAFA" },
        { numero: "36", nombre: "CULEBRA" },
      ],
    }).save();
    numeros = [numero];
  }
  numeros.forEach((numero) => {
    redisRepo.hjson(RedisCache.NUMEROS, numero._id, numero);
  });
  //#endregion

  //#region menus
  const menus = await menuModel.find().lean();
  menus.forEach((menu) => {
    redisRepo.hjson(RedisCache.MENUS, menu._id, menu);
  });
  //#endregion

  //#region permisos
  const _permisos = [
    {
      codigo: 1,
      descripcion: "Iniciar sesion",
      grupo: "sesion",
    },
    {
      codigo: 10,
      descripcion: "Ver Operadoras",
      grupo: "operadoras",
    },
    {
      codigo: 11,
      descripcion: "Modificar Operadoras",
      grupo: "operadoras",
    },
    {
      codigo: 20,
      descripcion: "Ver Sorteos",
      grupo: "sorteos",
    },
    {
      codigo: 21,
      descripcion: "Modificar Sorteos",
      grupo: "sorteos",
    },
    {
      codigo: 22,
      descripcion: "Registrar Sorteos",
      grupo: "sorteos",
    },
    {
      codigo: 23,
      descripcion: "Premiar Sorteos",
      grupo: "sorteos",
    },
    {
      codigo: 30,
      descripcion: "Ver Permisos",
      grupo: "permisos",
    },
    {
      codigo: 31,
      descripcion: "Modificar Permisos",
      grupo: "permisos",
    },
    {
      codigo: 40,
      descripcion: "Ver Cupos",
      grupo: "cupos",
    },
    {
      codigo: 41,
      descripcion: "Mofidificar Cupos",
      grupo: "cupos",
    },
    {
      codigo: 50,
      descripcion: "Ver Usuarios",
      grupo: "usuarios",
    },
    {
      codigo: 51,
      descripcion: "Modificar Usuarios",
      grupo: "usuarios",
    },
    {
      codigo: 52,
      descripcion: "Usuarios Online",
      grupo: "usuarios",
    },
    {
      codigo: 60,
      descripcion: "Monitor Ventas",
      grupo: "ventas",
    },
    {
      codigo: 61,
      descripcion: "Anular Ventas",
      grupo: "ventas",
    },
    {
      codigo: 70,
      descripcion: "Ver saldos",
      grupo: "saldo",
    },
    {
      codigo: 71,
      descripcion: "Recargar saldo",
      grupo: "saldo",
    },
    {
      codigo: 72,
      descripcion: "Retirar saldo",
      grupo: "saldo",
    },
  ];
  if ((await sys_permisoModel.find().countDocuments()) == 0)
    await sys_permisoModel.insertMany(_permisos);
  /** @type {Permiso[]} */
  let permisos = await permisoModel.find().lean();
  if (permisos.length == 0) {
    const master = await usuarioRepo.findByUsuario("master");
    const permiso = new permisoModel({
      nombre: "master",
      permisos: _permisos.map((permiso) => permiso.codigo),
      usuario: master._id,
      predeterminado: true,
    });
    await permiso.save();
    console.log("[Init] Permiso de admin registrado");
    usuarioRepo.permisos.asignar(master._id, permiso._id);
    permisos = [permiso];
  }
  permisos.forEach((permiso) => {
    redisRepo.hjson(RedisCache.PERMISOS, permiso._id, permiso);
  });
  //#endregion

  //#region operadoras
  const operadoras = await operadoraRepo.buscar.todas();
  operadoras.forEach((operadora) => {
    redisRepo.hjson(RedisCache.OPERADORAS, operadora._id, operadora);
  });
  //#endregion

  //#region balance
  const balances = await saldoRepo.buscar.balance_todos()
  balances.forEach((balance) => {
    redisRepo
      .hset(RedisCache.BALANCE, balance._id.toString(), Number(balance.balance))
      .catch(onError);
    redisRepo
      .hset(RedisCache.BALANCE_MONEDA, balance.toString(), balance.moneda)
      .catch(onError);
  });
  //#endregion

  //#region monedas
  let monedas = await monedaModel.find({}, "nombre siglas principal").lean();
  if (!monedas || monedas.length == 0) {
    monedas = await monedaModel.insertMany([
      { nombre: "Bolivar", siglas: "ves", principal: false },
      { nombre: "Dolar", siglas: "usd", principal: true },
    ]);
  }
  monedas.forEach((moneda) => {
    redisRepo.hjson(RedisCache.MONEDA, moneda._id, moneda);
  });
  //#endregion

  //#region stats
  var total = 0,
    comerciales = 0,
    bancas = 0,
    grupos = 0,
    taquillas = 0,
    agentes = 0,
    online = 0,
    auditor = 0,
    master = 0,
    activos = 0,
    papelera = 0;
  let usuarios = await usuarioModel.find(null, "rol activo papelera").lean();
  await syncForEach(usuarios, (usuario) => {
    total++;
    if (usuario.rol == DTOUsuario.MULTI) comerciales++;
    if (usuario.rol == DTOUsuario.BANCA) bancas++;
    if (usuario.rol == DTOUsuario.GRUPO) grupos++;
    if (usuario.rol == DTOUsuario.TAQUILLA) taquillas++;
    if (usuario.rol == DTOUsuario.AGENTE) agentes++;
    if (usuario.rol == DTOUsuario.ONLINE) online++;
    if (usuario.rol == DTOUsuario.AUDITOR) auditor++;
    if (usuario.rol == DTOUsuario.MASTER) master++;
    if (usuario.activo) activos++;
    if (usuario.papelera) papelera++;
  });
  redisRepo.hset_args(
    RedisCache.ESTADISTICAS,
    "total",
    total,
    DTOUsuario.MULTI,
    comerciales,
    DTOUsuario.BANCA,
    bancas,
    DTOUsuario.GRUPO,
    grupos,
    DTOUsuario.TAQUILLA,
    taquillas,
    DTOUsuario.AGENTE,
    agentes,
    DTOUsuario.ONLINE,
    online,
    DTOUsuario.AUDITOR,
    auditor,
    DTOUsuario.MASTER,
    master,
    "activos",
    activos,
    "papelera",
    papelera
  );
  //#endregion
}

function onError(error) {
  console.error(error);
}
