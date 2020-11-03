var request = require("supertest");
var app = require("../app.js");
const { usuarios } = require("./usuarios.data.js");
const anError = (res) => {
  if (res.body.error) throw new Error(res.body.error);
  return res;
};
const { init, login, token } = require("./common.js");
init(app, anError);

const Operadora = require("../dto/operadora-dto.js");
const Usuario = require("../dto/usuario-dto.js");
const topeModel = require("_modelos/tope-model");
const operadoraRepo = require("../repositorio/operadora-repo.js");
const usuarioRepo = require("../repositorio/usuario-repo.js");
const { topes } = require("./data.js");

/** @type {Usuario} */
let comercial;
/** @type {Usuario} */
let master;

/** @type {Operadora[]} */
let operadoras;
/** @type {Usuario[]} */
let hijos;
/** @type {Array} */
let topesData;

before(async () => {
  await topeModel.deleteMany();
  comercial = await login(usuarios.comerciales[0]);
  master = await login({ usuario: "master", clave: "1234" });
  operadoras = await operadoraRepo.buscar.todas();
  hijos = await usuarioRepo.buscar.hijos(comercial._id);
  topesData = topes.filter((tope) => tope.padre == comercial.usuario);
});

describe("topes", () => {
  let topesUsuario = [];
  it("registrar tope master", async function () {
    for (let i = 0; i < operadoras.length; i++) {
      const operadora = operadoras[i];
      await request(app)
        .post("/sorteo/tope/nuevo")
        .set(token(master.token))
        .send({
          usuario: master._id,
          monto: 1000000,
          operadora: operadora._id,
        })
        .expect(200)
        .expect(anError);
    }
  });
  it.skip("registrar topes", async function () {
    let tope = topesData.pop();
    while (tope) {
      const _tope = {
        usuario: hijos.find((hijo) => hijo.usuario == tope.usuario)._id,
        monto: tope.monto,
        operadora: operadoras.find((operadora) => {
          return operadora.nombre == tope.operadora;
        })._id,
      };
      await request(app)
        .post("/sorteo/tope/nuevo")
        .set(token)
        .send(_tope)
        .expect(200)
        .expect(anError)
        .then((res) => topesUsuario.push(res.body));
      tope = topesData.pop();
    }
  });
  it.skip("remover tope", function () {
    this.timeout(0);
    const tope = topesUsuario.pop();
    return request(app)
      .post("/sorteo/tope/remover")
      .set(token)
      .send({ tope: tope._id })
      .expect(200)
      .then(anError);
  });
});
