const anError = (res) => {
  if (res.body.error) throw new Error(JSON.stringify(res.body.error));
  return res;
};

var request = require("supertest");
var app = require("../app.js");
const Usuario = require("../dto/usuario-dto.js");

const { init, login, token } = require("./common.js");
init(app, anError);

/** @type {Usuario} */ let taquilla;

before((done) => {
  login({ usuario: "online1", clave: "1234" }).then((usuario) => {
    taquilla = usuario;
    done();
  });
});

describe("reporte taquilla", () => {
  it("reporte general", function () {
    return request(app)
      .get(
        `/api/pos/reporte/general/usuario?usuario=${taquilla._id}&desde=2020-01-01&hasta=2020-12-30&moneda=ves`
      )
      .set(token(taquilla.token))
      .then(anError)
      .then((result) => {
        console.log("result :>> ", result.body);
      });
  });
});
