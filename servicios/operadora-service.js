const topeUtil = require("../utils/tope-util");

const Operadora = require("../dto/operadora-dto");
const Usuario = require("../dto/usuario-dto");

const operadoraRepo = require("../repositorio/operadora-repo");
const usuarioRepo = require("../repositorio/usuario-repo");
const operadora_pagaModel = require("_modelos/operadora_paga-model");

module.exports = {
  /**
   * @param {String} nombre
   * @param {String} tipo
   * @param {Number} paga
   * @param {Array<String>} sorteos
   * @returns {Promise<Operadora>}
   */
  registro(nombre, tipo, paga, sorteos, numeros) {
    return operadoraRepo.guardar(nombre, tipo, paga, sorteos, numeros);
  },
  /**
   * @param {String} operadoraId
   * @param {Operadora} datos
   * @returns {Promise<Boolean>}
   */
  editar(operadoraId, datos) {
    return operadoraRepo.editar(operadoraId, datos);
  },
  remover(operadoraId) {
    return operadoraRepo.remover(operadoraId)
  },
  /**
   *
   * @param {String} usuarioId
   * @param {String[]} operadoraIds
   * @param {Boolean} mostrar
   */
  enlazar(usuarioId, operadoraIds, mostrar) {
    return new Promise(async (resolve, reject) => {
      const usuario = await usuarioRepo.buscar.id(usuarioId);
      if (!usuario) return reject(`usuario '${usuarioId}' no existe`);

      const nivel = topeUtil.calcularNivel(usuario.rol);
      const enlacesPrevios = await operadoraRepo.buscar.enlacesUsuario(usuario);

      const enlacePrevio = operadoraIds.find((operadoraId) => {
        return enlacesPrevios.find((enlace) => {
          return (
            enlace.operadora.toString() == operadoraId && enlace.nivel == nivel
          );
        });
      });

      if (enlacePrevio) return reject("Error: Enlace duplicado");

      let cola = [];
      for (let i = 0; i < operadoraIds.length; i++) {
        const operadoraId = operadoraIds[i];
        const operadora = await operadoraRepo.buscar.id(operadoraId);
        if (!operadora) return reject(`operadora '${operadoraId}' no existe`);
        cola.push(
          operadoraRepo.enlaceNuevo(usuario._id, operadora._id, mostrar, nivel)
        );
      }
      Promise.all(cola)
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  enlaceRemover(usuarioId, enlaceId) {
    return operadoraRepo.enlaceRemover(usuarioId, enlaceId);
  },
  /**
   * @param {String} usuarioId
   * @param {String} enlaceId
   * @param {Boolean} activo
   */
  enlaceActivar(usuarioId, enlaceId, activo) {
    return operadoraRepo.enlaceActivar(usuarioId, enlaceId, activo);
  },

  paga: {
    /**
     * @param {String} operadora
     * @param {String} grupo
     * @param {Number} monto
     */
    nuevo(operadora, grupo, monto) {
      return operadoraRepo.pagos.nuevo(operadora, grupo, monto);
    },
  },

  grupos: {
    /**
     * @param {String} grupoId
     * @param {Usuario} usuario
     */
    buscarId(grupoId) {
      return new Promise((resolve, reject) => {
        operadoraRepo.grupos.buscar
          .id(grupoId)
          .then((grupo) => {
            operadoraRepo
              .paga(grupo._id)
              .then((pagos) => {
                resolve({ grupo, pagos });
              })
              .catch((error) => reject(error));
          })
          .catch((error) => reject(error));
      });
    },
    /**
     * @param {String} nombre
     * @param {String} descripcion
     * @param {Usuario} usuario
     */
    nuevo(nombre, descripcion, usuario) {
      return operadoraRepo.grupos.nuevo(nombre, descripcion, usuario);
    },
    /**
     * @param {String} grupoId
     * @param {Usuario} usuario
     */
    remover(grupoId, usuario) {
      return operadoraRepo.grupos.remover(grupoId, usuario._id);
    },
  },
};
