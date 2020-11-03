//process.env.NODE_ENV = "mocha";
const { expect } = require("chai");
var request = require("supertest");
var app = require("../app.js");
const anError = (res) => {
  if (res.body.error) throw new Error(res.body.error);
  return res;
};
const { init, login, token } = require("./common.js");
init(app, anError);

const enlace_operadoraModel = require("_modelos/enlace_operadora-model");
const Operadora = require("../dto/operadora-dto.js");
const operadoraRepo = require("../repositorio/operadora-repo.js");

const Usuario = require("../dto/usuario-dto.js");
const EnlaceOperadora = require("../dto/enlace-operadora-dto.js");
const operadoraModel = require("_modelos/operadora-model");
const usuarioModel = require("_modelos/usuario-model");
let comercialToken;
/** @type {Usuario} */ let hijoComercial;
/** @type {Operadora[]} */ let operadoras;
/** @type {Usuario} */ let master;
/** @type {Usuario[]} */ let hijos;

before(async () => {
  await enlace_operadoraModel.deleteMany();
  master = await login({ usuario: "master", clave: "1234" });
  hijos = await usuarioModel.find({ rol: { $in: ["multi", "agente"] } });
  operadoras = await operadoraModel.find().lean();
  operadoras = operadoras.filter((o) => o.sorteos.length > 0);
});

describe("enlaces", function () {
  it("enlaces operadora", async function () {
    const payload = {
      usuario: master._id,
      operadora: operadoras.map((op) => op._id),
      mostrar: true,
    };
    await registrar(payload, token(master.token)).then((data) => {
      console.log("data :>> ", data);
    });
  });
  it("buscar operadoras", (done) => {
    request(app)
      .get("/operadora/buscar/todas")
      .set(token(master.token))
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.length.above(0);
        operadoras = res.body;
        done();
      });
  });
  it("registrar enlaces", async () => {
    for (let i = 0; i < hijos.length; i++) {
      const payload = {
        usuario: hijos[i]._id,
        operadora: operadoras.map((operadora) => operadora._id),
        mostrar: true,
      };
      await registrar(payload, token(master.token));
    }
  });
  it.skip("registrar enlaces: DUPLICADO", (done) => {
    request(app)
      .post("/operadora/enlace/nuevo")
      .set(comercialToken)
      .expect(200)
      .send({
        usuario: hijoComercial._id,
        operadora: [operadoras[0]._id],
        mostrar: true,
      })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.ownProperty("error");
        done();
      });
  });
  it.skip("desactivar enlace", async () => {
    const enlaces = await operadoraRepo.buscar.enlacesUsuario(
      hijoComercial._id
    );
    return request(app)
      .post("/operadora/enlace/activar")
      .set(comercialToken)
      .send({
        usuario: hijoComercial._id,
        enlace: enlaces[enlaces.length - 2]._id,
        activo: false,
      })
      .expect(200)
      .then(anError);
  });
  it.skip("remover enlace", async () => {
    const enlaces = await operadoraRepo.buscar.enlacesUsuario(
      hijoComercial._id
    );
    const enlace = enlaces.pop();
    console.log("removiendo enlace", enlace._id);
    return request(app)
      .post("/operadora/enlace/remover")
      .set(comercialToken)
      .send({
        usuario: hijoComercial._id,
        enlace: enlace._id,
      })
      .expect(200)
      .then(anError);
  });
});

function registrar(data, token) {
  return new Promise(async (resolve, reject) => {
    request(app)
      .post("/operadora/enlace/nuevo")
      .set(token)
      .expect(200)
      .expect(anError)
      .send(data)
      .end((err, res) => {
        if (err) return reject(err);
        resolve(res.data);
      });
  });
}
