const usuarioModel = require("_modelos/usuario-model");
const Usuario = require("../dto/usuario-dto");
const md5 = require("md5");
const metodo_pagoModel = require("_modelos/metodo_pago-model");
const redisRepo = require("./redis-repo");
const permisoModel = require("_modelos/permiso-model");
const transaccionModel = require("_modelos/transaccion-model");
const RedisCache = require("../dto/redis-cache.dto");
const { ultimoSaldo } = require("./saldo-repo");
const ObjectId = require("mongoose").Types.ObjectId;

const NEW_OPT = { new: true };

module.exports = {
  /** JSDoc
   * @param {String} usuario
   * @returns {Usuario}
   */
  async login(usuario) {
    return new Promise((resolve, reject) => {
      usuarioModel.aggregate(
        [
          { $match: { usuario, papelera: false } },
          {
            $lookup: {
              from: "permisos",
              foreignField: "_id",
              localField: "permisos",
              as: "_permisos",
            },
          },
          { $addFields: { permisos: { $arrayElemAt: ["$_permisos", 0] } } },
          {
            $project: {
              _permisos: 0,
              creado: 0,
              papelera: 0,
              __v: 0,
              "permisos.nombre": 0,
              "permisos.predeterminado": 0,
              "permisos.rol": 0,
              "permisos.__v": 0,
            },
          },
        ],
        (error, usuarios) => {
          if (error) return reject(error.message);
          if (usuarios.length > 0) resolve(usuarios[0]);
          else resolve(null);
        }
      );
    });
  },
  saldo(usuarioId) {
    return new Promise(async (resolve, reject) => {
      let saldo = await redisRepo.hget(
        RedisCache.BALANCE,
        usuarioId,
        RedisCache.CAST_NUMBER
      );
      if (saldo) return resolve(saldo);
      saldo = await ultimoSaldo(usuarioId);
      resolve(saldo);
    });
  },
  /** JSDoc
   * @param {String} usuario
   * @returns {Usuario}
   */
  async findByUsuario(usuario) {
    return await usuarioModel
      .findOne({
        usuario,
      })
      .lean();
  },
  /** JSDoc
   * @param {String} usuarioId
   * @param {Boolean} [lean=1]
   * @returns {Promise<Usuario>} UsuarioDTO
   */
  async findById(Id, lean = true) {
    if (lean) return await usuarioModel.findById(Id).lean();
    else return await usuarioModel.findById(Id);
  },
  reporte: {
    transacciones(usuarioId, rechazada = false, cancelada = false) {
      return new Promise((resolve, reject) => {
        transaccionModel.aggregate(
          [
            { $match: { usuario: ObjectId(usuarioId), rechazada, cancelada } },
            {
              $group: {
                _id: "$tipo",
                monto: { $sum: "$monto" },
                num: { $sum: 1 },
              },
            },
          ],
          (error, result) => {
            if (error) return reject(error.message);
            resolve({
              recargas: result.find((r) => r._id == "recarga"),
              retiros: result.find((r) => r._id == "retiro"),
            });
          }
        );
      });
    },
  },
  buscar: {
    /**
     * @param {String} usuarioId
     * @param {Boolean=} lean true
     * @return {Promise<Usuario>}
     */
    async id(usuarioId) {
      return await usuarioModel.findById(usuarioId).lean();
    },
    /**
     *
     * @param {String} usuario
     * @return {Promise<Usuario>}
     */
    async usuario(usuario) {
      return await usuarioModel.findOne({ usuario }).lean();
    },
    /**
     * @param {String} padre
     * @param {String} rol
     * @param {Boolean=} lean true
     * @return {Promise<Usuario[]>}
     */
    async rol(padre, rol, lean = true) {
      if (lean)
        return await usuarioModel.find({ rol, jerarquia: padre }).lean();
      else return await usuarioModel.find({ rol, jerarquia: padre });
    },
    /**
     * @param {String} padre
     * @param {Boolean=} lean true
     * @return {Promise<Usuario[]>}
     */
    async hijos(padre, rol, contar = false) {
      let condicion = { jerarquia: padre };
      if (rol) condicion.rol = rol;
      if (!contar) return await usuarioModel.find(condicion).lean();
      else return await usuarioModel.find(condicion).countDocuments();
    },
    /**
     * @param {String} padre
     * @param {Boolean} contar
     * @returns {Promise<Usuario[]|number>}
     */
    async hijosCercanos(padre, contar = false) {
      return new Promise((resolve, reject) => {
        let pipeLine = [
          { $match: { jerarquia: ObjectId(padre) } },
          { $addFields: { hijo: { $arrayElemAt: ["$jerarquia", -1] } } },
          { $match: { hijo: ObjectId(padre) } },
        ];
        if (contar) pipeLine.push({ $count: "total" });
        usuarioModel.aggregate(pipeLine, (error, result) => {
          if (error) return reject(error.message);
          if (!contar) resolve(result);
          else {
            if (result.length > 0) resolve(result[0].total);
            else resolve(0);
          }
        });
      });
    },
    /**
     * @param {String} padre
     * @returns {Promise<Object[]>}
     */
    async stat(padre) {
      return new Promise((resolve, reject) => {
        usuarioModel.aggregate(
          [
            { $match: { jerarquia: ObjectId(padre) } },
            {
              $project: {
                rol: 1,
                activo: { $cond: [{ $eq: ["$activo", true] }, 1, 0] },
                nPapelera: { $cond: [{ $eq: ["$papelera", true] }, 1, 0] },
              },
            },
            {
              $group: {
                _id: "$rol",
                cuenta: { $sum: 1 },
                activo: { $sum: "$activo" },
                papelera: { $sum: "$papelera" },
              },
            },
          ],
          (error, stats) => {
            if (error) return reject(error.message);
            resolve(stats);
          }
        );
      });
    },
    /**
     * @param {String} correo
     * @returns {Promise<Usuario>}
     */
    async correo(correo) {
      return await usuarioModel.findOne({ correo }).lean();
    },
  },
  /** JSDoc
   * @param {Usuario} padre
   * @param {String} nombre
   * @param {String} usuario
   * @param {String} clave
   * @param {String} rol
   * @param {Boolean} activo
   * @param {String} correo
   * @param {String} telefono
   * @param {Number} comision
   * @param {Number} participacion
   * @param {String} permiso
   * @returns {Promise<Usuario>}
   */
  async registro(
    padre,
    nombre,
    usuario,
    clave,
    rol,
    activo,
    correo,
    telefono,
    comision,
    participacion,
    utilidad,
    permisos,
    moneda,
    cedula
  ) {
    let jerarquia = [...padre.jerarquia, padre._id];
    let nHash = padre.usuario;
    let codigo = await redisRepo.hget(
      "cache_usr_hijos",
      nHash,
      RedisCache.CAST_NUMBER
    );
    if (codigo) {
      codigo = await redisRepo.hincrby("cache_usr_hijos", nHash, 1);
    } else {
      codigo = await this.buscar.hijosCercanos(padre._id, true);
      codigo = await redisRepo.hincrby("cache_usr_hijos", nHash, codigo);
    }
    codigo = [padre.codigo, codigo + 1].join("-");
    return new Promise((resolve, reject) => {
      new usuarioModel({
        nombre,
        usuario,
        clave: md5(clave),
        rol,
        activo,
        correo,
        telefono,
        jerarquia,
        comision,
        participacion,
        utilidad,
        permisos,
        codigo,
        moneda,
        cedula,
      }).save((err, usuario) => {
        if (err) return reject(err.message);
        resolve(usuario);
      });
    });
  },
  /** JSDoc
   * @param {String} usuarioId
   * @param {Object} campos
   * @param {Boolean=} campos.activo
   * @returns {Promise<Usuario>}
   */
  async modificar(usuarioId, campos) {
    return new Promise((resolve, reject) => {
      if (campos.hasOwnProperty("rol"))
        return reject('cambiar el campo "rol" no esta permitido');
      if (campos.hasOwnProperty("clave"))
        return reject('cambiar el campo "clave" no esta permitido');
      return usuarioModel.findByIdAndUpdate(
        usuarioId,
        campos,
        NEW_OPT,
        (err, usuario) => {
          if (err) return reject(err.errmsg);
          else resolve(usuario);
        }
      );
    });
  },
  /** JSDoc
   * @param {String} usuarioId
   * @param {String} claveActual
   * @param {String} claveNueva
   * @returns {Promise<Object>}
   */
  async cambioClave(usuarioId, claveNueva) {
    return new Promise((resolve, reject) => {
      let clave = md5(claveNueva);
      usuarioModel.updateOne({ _id: usuarioId }, { clave }, (err, result) => {
        if (err) return reject(err.errmsg);
        resolve({ ok: 1 });
      });
    });
  },
  metodo: {
    /**
     * @param {String} usuarioId
     * @param {String} entidad
     * @param {String} moneda
     * @param {String} direccion
     * @param {String} meta
     */
    nuevo(usuarioId, entidad, moneda, direccion, meta) {
      return new Promise((resolve, reject) => {
        new metodo_pagoModel({
          usuario: usuarioId,
          entidad,
          moneda,
          direccion,
          meta,
        }).save((error, metodo) => {
          if (error) return reject(error.message);
          resolve(metodo);
        });
      });
    },
    buscar: {
      async usuario(usuarioId) {
        return await metodo_pagoModel.find({ usuario: usuarioId }).lean();
      },
    },
  },
  permisos: {
    todos() {
      return new Promise((resolve, reject) => {
        permisoModel.find(null, (error, result) => {
          if (error) return reject(error.message);
          resolve(result);
        });
      });
    },
    todos_lista() {
      return new Promise((resolve, reject) => {
        permisoModel.find(null, "nombre rol", (error, result) => {
          if (error) return reject(error.message);
          resolve(result);
        });
      });
    },
  },
  /**
   * @param {String} usuarioId
   * @returns {Object}
   */
  async meta(usuarioId) {
    const meta = await usuarioModel.findById(usuarioId, "meta");
    if (meta) return meta.meta;
    return {};
  },
};
