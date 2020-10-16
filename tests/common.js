const Usuario = require("../dto/usuario-dto");
const request = require("supertest");

var $app, $anError;
module.exports = {
  init(app, anError) {
    $app = app;
    $anError = anError;
  },
  /**
   * @param {Object} usuario
   * @return {Promise<Usuario>} usuario
   */
  login(usuario) {
    return new Promise((resolve, reject) => {
      request($app)
        .post("/auth")
        .send({
          usuario: usuario.usuario,
          clave: usuario.clave,
        })
        .expect(200)
        .expect($anError)
        .end((err, res) => {
          if (err) return reject(err);
          resolve(res.body);
        });
    });
  },
  token(key) {
    return { Authorization: `Bearer ${key}` };
  },
};
