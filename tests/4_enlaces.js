//process.env.NODE_ENV = "mocha";
const { expect } = require("chai");
var request = require("supertest");
var app = require("../app.js");
const anError = (res) => {
  if (res.body.error) throw new Error(res.body.error);
  return res;
};
const enlace_operadoraModel = require("_modelos/enlace_operadora-model");
const Operadora = require("../dto/operadora-dto.js");
const operadoraRepo = require("../repositorio/operadora-repo.js");

const { usuarios, hijos } = require("./usuarios.data");
let comercialToken;
/** @type {Usuario} */
let hijoComercial;
/** @type {Operadora[]} */
let operadoras;

before(async () => {
  await enlace_operadoraModel.deleteMany();
});

describe("login comercial", () => {
  const comercial = usuarios.comerciales[0];
  it("login", (done) => {
    login(comercial)
      .then((data) => {
        comercialToken = {
          Authorization: `Bearer ${data.token}`,
        };
        done();
      })
      .catch((error) => done(error));
  });
});

describe("enlaces", () => {
  it("no tiene enlaces", function (done) {
    let hijo = hijos("bancas", "comercial")[0];
    if (!hijo) {
      console.log("error");
    }
    login(hijo).then((hijo) => {
      hijoComercial = hijo;
      request(app)
        .get(`/operadora/buscar/enlaces?usuario=${hijo._id}`)
        .set(comercialToken)
        .expect(200)
        .expect(anError)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.length(0);
          done();
        });
    });
  });
  it("buscar operadoras", (done) => {
    request(app)
      .get("/operadora/buscar/todas")
      .set(comercialToken)
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.length.above(0);
        operadoras = res.body;
        done();
      });
  });
  it("registrar enlaces", (done) => {
    const operadoraIds = operadoras.map((operadora) => operadora._id);
    request(app)
      .post("/operadora/enlace/nuevo")
      .set(comercialToken)
      .expect(200)
      .expect(anError)
      .send({
        usuario: hijoComercial._id,
        operadora: operadoraIds,
        mostrar: true,
      })
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it("registrar enlaces: DUPLICADO", (done) => {
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
  it("desactivar enlace", async () => {
    const enlaces = await operadoraRepo.buscar.enlacesUsuario(
      hijoComercial._id
    );
    return request(app)
      .post("/operadora/enlace/activar")
      .set(comercialToken)
      .send({
        usuario: hijoComercial._id,
        enlace: enlaces[0]._id,
        activo: false,
      })
      .expect(200)
      .then(anError);
  });
  it("remover enlace", async () => {
    const enlaces = await operadoraRepo.buscar.enlacesUsuario(
      hijoComercial._id
    );
    request(app)
      .post("/operadora/enlace/remover")
      .set(comercialToken)
      .send({
        usuario: hijoComercial._id,
        enlace: enlaces[1]._id,
      })
      .expect(200)
      .then(anError);
  });
});

function login(usuario) {
  return new Promise((resolve, reject) => {
    request(app)
      .post("/auth")
      .send({
        usuario: usuario.usuario,
        clave: usuario.clave,
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return reject(err);
        resolve(res.body);
      });
  });
}
