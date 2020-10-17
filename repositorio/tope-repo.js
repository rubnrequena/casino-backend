const topeModel = require("_modelos/tope-model");
const Usuario = require("../dto/usuario-dto");
const Tope = require("../dto/tope-dto");
const { calcularOrden } = require("../utils/tope-util");
const { isObjectId } = require("../utils/object-util");
const redisRepo = require("./redis-repo");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

module.exports = {
  /**Guardar nuevo tope
   * @param {Usuario} usuario
   * @param {Number} monto
   * @param {String} operadora
   * @param {String} sorteo
   * @param {String} numero
   * @param {Usuario} responsable
   * @returns {Promise<Tope>}
   */
  nuevo(usuario, monto, operadora, sorteo, numero, responsable) {
    let orden = calcularOrden(usuario.rol, sorteo, numero);
    return new Promise((resolve, reject) => {
      let tope = {
        usuario: usuario._id,
        jerarquia: [...usuario.jerarquia, usuario._id],
        nivel: usuario.rol,
        monto,
        operadora,
        orden,
        responsable: {
          _id: responsable._id,
          nombre: responsable.nombre,
        },
      };
      if (isObjectId(sorteo)) tope.sorteo = sorteo;
      const nan = isNaN(numero);
      if (!nan && numero != "") tope.numero = numero;
      new topeModel(tope).save((error, tope) => {
        if (error) return reject(error.message);
        resolve(tope);
      });
    });
  },
  editar(topeId, campos) {
    return new Promise((resolve, reject) => {
      topeModel.updateOne(
        {
          _id: topeId,
        },
        campos,
        (error, result) => {
          if (error) return reject(error.message);
          resolve(result);
        }
      );
    });
  },
  /**
   * @param {String} topeId
   */
  remover(topeId) {
    return new Promise((resolve, reject) => {
      topeModel.deleteOne({ _id: topeId }, (error, result) => {
        if (error) return reject(error.message);
        resolve(result);
      });
    });
  },
  /**
   *
   * @param {String} topeId
   * @param {String} usuarioId
   * @return {String} ID del usuario hijo menor
   */
  ultimoHijo(topeId, usuarioId) {
    return new Promise((resolve, reject) => {
      topeModel.aggregate(
        [
          {
            $match: {
              _id: ObjectId(topeId),
              jerarquia: ObjectId(usuarioId),
            },
          },
          { $project: { hijo: { $arrayElemAt: ["$jerarquia", -1] } } },
        ],
        (error, result) => {
          if (error) return reject(error.message);
          if (result.length == 0) return reject(`tope '${topeId}' no existe`);
          resolve(result.hijo);
        }
      );
    });
  },
  buscar: {
    /**
     * @param {String} operadora
     * @param {Usuario} usuario
     * @param {String} sorteo
     * @returns {Promise<Tope[]>}
     */
    por(operadora, usuario) {
      return new Promise((resolve, reject) => {
        let filtro = { nivel: usuario.rol };
        if (isObjectId(operadora)) filtro.operadora = operadora;
        if (isObjectId(usuario._id)) filtro.jerarquia = usuario._id;
        topeModel
          .find(
            filtro,
            "monto numero sorteo activo responsable registrado",
            (error, topes) => {
              if (error) return reject(error.message);
              resolve(topes);
            }
          )
          .populate(
            "usuario operadora sorteo",
            "codigo nombre descripcion fecha"
          )
          .lean();
      });
    },
    /**Lista los topes de un usuario
     * @param {Usuario} usuarioID
     * @returns {Promise<Tope[]>}
     */
    async porUsuario(usuarioID) {
      return await topeModel
        .find({
          jerarquia: usuarioID,
        })
        .lean();
    },
    /**Obtiene los topes para la venta de una taquilla
     * @param {Usuario} taquilla
     * @param {String} operadora
     * @param {String} sorteo
     * @param {String} numero
     * @returns {Promise<Tope[]>}
     */
    paraVender(taquilla, operadora) {
      return new Promise((resolve, reject) => {
        const jerarquia =
          taquilla.rol == Usuario.TAQUILLA
            ? Usuario.NIVELES
            : Usuario.NIVELES_ONLINE;
        let mapaJerarquia = [];
        let i, item;
        for (i = 0; i < taquilla.jerarquia.length; i++) {
          const padre = taquilla.jerarquia[i];
          item = { nivel: jerarquia[i] };
          item[`jerarquia.${i}`] = ObjectId(padre);
          mapaJerarquia.push(item);
        }
        // anexar la taquilla al final del arbol
        item = { nivel: jerarquia[i] };
        item[`jerarquia.${i}`] = ObjectId(taquilla._id);
        mapaJerarquia.push(item);
        const condicion = [
          {
            $match: {
              operadora: ObjectId(operadora),
              activo: true,
              $or: mapaJerarquia,
            },
          },
          { $sort: { orden: 1 } },
          {
            $project: {
              monto: 1,
              numero: 1,
              sorteo: 1,
              nivel: 1,
              usuario: { $arrayElemAt: ["$jerarquia", -1] },
            },
          },
        ];
        topeModel.aggregate(condicion, (error, topes) => {
          if (error) return reject(error.message);
          resolve(topes);
        });
      });
    },
  },
};
