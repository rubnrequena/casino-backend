var request = require("supertest");
const sorteoModel = require("_modelos/sorteo-model");
var app = require("../app.js");
const Operadora = require("../dto/operadora-dto.js");
const Usuario = require("../dto/usuario-dto.js");
const operadoraRepo = require("../repositorio/operadora-repo.js");
const anError = (res) => {
  if (res.body.error) throw new Error(res.body.error);
  return res;
};
const { init, login } = require("./common.js");
init(app, anError);

/** @type {Usuario} */
let master;
let token;
/** @type {Operadora[]} */
let operadoras;
const hoy = new Date().toISOString().substr(0, 10);
before(async () => {
  await sorteoModel.deleteMany({
    fecha: hoy,
  });
  master = await login({ usuario: "master", clave: "1234" });
  token = {
    Authorization: `Bearer ${master.token}`,
  };
  operadoras = await operadoraRepo.buscar.todas();
});

describe("registrar sorteos", async function () {
  this.timeout(0);
  it("registrar sorteos", async function () {
    let operadora = operadoras.shift();
    while (operadora) {
      await request(app)
        .post("/sorteo/nuevo")
        .set(token)
        .send({
          desde: hoy,
          hasta: hoy,
          operadora: operadora._id,
        })
        .expect(200)
        .then(anError);
      operadora = operadoras.shift();
    }
  });
});
