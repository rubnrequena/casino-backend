const Usuario = require("../dto/usuario-dto");
const jwtService = require("./jwt-service");
const md5 = require("md5");
const usuarioRepo = require("../repositorio/usuario-repo");
const topeRepo = require("../repositorio/tope-repo");
const operadoraRepo = require("../repositorio/operadora-repo");
const saldoRepo = require("../repositorio/saldo-repo");
const redisRepo = require("../repositorio/redis-repo");
const permisosRepo = require("../repositorio/permisos-repo");
const sistemaRepo = require("../repositorio/sistema-repo");

const RedisCache = require("../dto/redis-cache.dto");
const Permiso = require("../dto/permiso.dto");
const menuModel = require("_modelos/menu-model");
const permisoModel = require("_modelos/permiso-model");
const plantillas = require("../mail/plantillas");

const topeUtil = require("../utils/tope-util");
const { syncForEach } = require("../utils/array-util");
const usuarioService = require("./usuario-service");

const config = require("../config");
const enviarCorreo = require("../mail");

module.exports = {
  /**
   * @param {String} usuario
   * @param {String} clave
   * @returns {Promise<Usuario>} returns Usuario
   */
  login(usuario, clave) {
    return new Promise(async (resolve, reject) => {
      const _usuario = await usuarioRepo.login(usuario);
      if (!_usuario) return reject("usuario no existe");
      /* TODO Seprar inicios de sesion
       if (_usuario.rol == Usuario.ONLINE || _usuario.rol == Usuario.TAQUILLA)
        return reject("usuario invalido"); */
      if (_usuario.activo === false) return reject("usuario inactivo");
      if (_usuario.clave == md5(clave)) {
        //#region menu
        if (_usuario.rol != "online" && _usuario.rol != "taquilla") {
          let menu;
          if (_usuario.menu)
            menu = await redisRepo.hjson(RedisCache.MENUS, _usuario.menu);
          if (!menu) {
            menu = await menuModel.findOne({
              rol: _usuario.rol,
              predeterminado: true,
            });
          }
          _usuario.menu = menu.menu;
        }
        //#endregion
        //#region monedas
        let monedas = [];
        await syncForEach(_usuario.moneda.split(","), async (siglas) => {
          let moneda = await sistemaRepo.moneda(siglas);
          if (moneda) monedas.push(moneda);
        });
        _usuario.moneda = monedas;
        //#endregion
        //#region permisos
        const permiso = await permisosRepo.buscar.id(_usuario.permisos);
        if (!permiso) reject("lo siento, no tiene permisos para acceder");
        _usuario.permisos = permiso.permisos;
        //#endregion
        _usuario.token = jwtService.firmar(_usuario, permiso._id);
        if (_usuario.rol == Usuario.ONLINE) {
          let saldo = await saldoRepo.ultimoSaldo(_usuario);
          _usuario.saldo = saldo;
          resolve(_usuario);
        } else resolve(_usuario);
      } else reject("contraseña incorrecta");
    });
  },
  /**
   * @param {String} padreId
   * @param {String} nombre
   * @param {String} usuario
   * @param {String} clave
   * @param {Boolean} activo
   * @param {String} correo
   * @param {String} telefono
   * @param {Object} comision
   * @param {Object} participacion
   */
  registro(
    padreId, nombre, usuario, clave, activo, correo, telefono,
    comision, participacion, utilidad, permisos, rol, moneda, cedula, grupoPago
  ) {
    return new Promise(async (resolve, reject) => {
      let padre = await usuarioRepo.buscar.id(padreId);
      if (!padre) return reject("padre no existe");
      if (padre.rol != Usuario.MASTER) rol = Usuario.rolHeradado(padre.rol);
      if (!rol) return reject("seleccione un rol valido");
      if (rol == Usuario.ONLINE && padre.rol != Usuario.AGENTE) {
        return reject(
          "usuario no tiene permisos para registrar el rol 'online'"
        );
      }
      if (!permisos) {
        permisos = await permisoModel.findOne({
          rol,
          predeterminado: true,
        });
      }
      //TODO: validar monedas
      if (Array.isArray(moneda)) moneda = moneda.join(",");

      usuarioRepo
        .registro(
          padre, nombre, usuario, clave, rol, activo, correo, telefono,
          comision, participacion, utilidad, permisos, moneda, cedula, grupoPago
        )
        .then((usuario) => {
          if (usuario.rol == Usuario.ONLINE) {
            saldoRepo.acreditar(usuario, "SALDO INICIAL", 0).catch((error) => {
              console.error(error);
            });
          }
          redisRepo.hincrby(RedisCache.ESTADISTICAS, usuario.rol, 1);
          resolve(usuario);
        })
        .catch((error) => reject(error));
    });
  },
  async registro_online(usuario, nombre, cedula, correo, clave) {
    const codigoConfirmacion = "cc" + md5(Date.now() + usuario.usuario);
    return redisRepo
      .json(codigoConfirmacion, {
        usuario,
        nombre,
        cedula,
        correo,
        clave,
      })
      .then(() => {
        redisRepo.expire(codigoConfirmacion, 60 * 60 * 24);
        const url = `${process.env.URL_VENTA_ONLINE}/login?codigo=${codigoConfirmacion}`;
        enviarCorreo(
          correo,
          plantillas.confirmar_correo(url, nombre),
          "Por favor, verifique su dirección de correo electrónico"
        );
      });
  },
  activar(codigo) {
    return new Promise(async (resolve, reject) => {
      let usuario = await redisRepo.json(codigo);
      if (!usuario) return reject("codigo invalido o expiro");
      else {
        const padre = await usuarioRepo.buscar.usuario(config.AGENTE_ONLINE);
        if (!padre)
          return reject(
            "Lo siento, no podemos darte de alta en estos momentos, intenta luego."
          );
        const permiso = await permisoModel.findOne({
          rol: Usuario.ONLINE,
          predeterminado: true,
        });
        this.registro(
          padre._id,
          usuario.nombre,
          usuario.usuario,
          usuario.clave,
          true,
          usuario.correo,
          "",
          0,
          0,
          0,
          permiso._id,
          Usuario.ONLINE,
          "ves",
          usuario.cedula
        )
          .then(async (usuario) => {
            await redisRepo.del(codigo);
            resolve(usuario);
          })
          .catch((error) => reject(error));
      }
    });
  },
  /**
   * @param {String} usuario
   * @param {String} clave
   * @param {String} correo
   * @param {String} telefono
   * @param {String} usuarioFuenteId
   * @returns {Usuario}
   */
  clonar(usuario, clave, nombre, correo, telefono, usuarioFuenteId) {
    return new Promise(async (resolve, reject) => {
      let fuente = await usuarioRepo.findById(usuarioFuenteId);
      if (!fuente) return reject("usuario a clonar no existe");
      usuarioRepo
        .registro(
          fuente,
          nombre,
          usuario,
          clave,
          fuente.rol,
          fuente.activo,
          correo,
          telefono,
          fuente.comision,
          fuente.participacion
        )
        .then((clon) => {
          //clonar topes
          topeRepo.buscar.porUsuario(usuarioFuenteId).then((topes) => {
            topes.forEach((tope) => {
              topeRepo.nuevo(
                clon,
                tope.monto,
                tope.operadora,
                tope.sorteo,
                tope.numero
              );
            });
          });
          //clonar sorteos
          operadoraRepo.buscar
            .enlacesUsuario(usuarioFuenteId)
            .then((enlaces) => {
              enlaces.forEach((enlace) => {
                const nivel = topeUtil.calcularNivel(clon.rol);
                operadoraRepo.enlaceNuevo(
                  clon._id,
                  enlace.operadora,
                  enlace.mostrar,
                  nivel
                );
              });
            });

          resolve(clon);
        })
        .catch((error) => reject(error));
    });
  },
  /**
   * @param {String} correo
   */
  recuperar_clave(correo) {
    return new Promise(async (resolve, reject) => {
      let usuario = await usuarioRepo.buscar.correo(correo);
      if (!usuario) return reject("El correo electronico ingresado no existe");
      const hash = md5(usuario._id + usuario.correo + Date.now().toString());
      await redisRepo.str(hash, usuario._id.toString());
      redisRepo.expire(hash, RedisCache.EXPIRE_1HORA);
      enviarCorreo(
        correo,
        plantillas.recuperar_clave(
          `https://caribeapuesta.com/#/recuperar?llave=${hash}`,
          usuario.nombre
        ),
        "CARIBE APUESTA - RECUPERAR CONTRASEÑA"
      );
      resolve({ result: 1 });
    });
  },
  cambiar_clave(llave, clave) {
    return new Promise(async (resolve, reject) => {
      let llaveUsuario = await redisRepo.str(llave);
      if (!llaveUsuario)
        return reject(
          "Solicitud de cambio de contraseña expiró, favor hacer una nueva solicitud."
        );
      let usuario = await usuarioRepo.buscar.id(llaveUsuario);
      usuarioService
        .cambioClave(usuario, clave)
        .then(async () => {
          await redisRepo.del(llave);
          resolve({ result: "Contraseña modificada exitosamente" });
        })
        .catch((e) => reject(e));
    });
  },

  permisos: {
    nuevo(nombre, predeterminado, permisos, usuario) {
      return permisosRepo.nuevo(nombre, predeterminado, permisos, usuario);
    },
    predefinir(usuario, permisoID) { },
    buscar: {
      /**
       * @param {Usuario} usuario
       * @return {Promise<Permiso>}
       */
      usuario(usuario) {
        return permisosRepo.buscar.usuario(usuario._id);
      },
    },
  },
};
