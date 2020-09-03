const sessionModel = require("_modelos/session-model");

module.exports = {
  nueva(usuarioId, geo, agente) {
    return new Promise((resolve, reject) => {
      let data = {
        usuario: usuarioId,
        agente,
      };
      if (geo) {
        data.ubicacion = {
          pais: geo.country,
          ciudad: geo.city,
          loc: {
            type: "Point",
            coordinates: geo.ll,
          },
        };
      }
      new sessionModel(data).save((error, sesion) => {
        if (error) return reject(error.message);
        resolve(sesion);
      });
    });
  },
};
