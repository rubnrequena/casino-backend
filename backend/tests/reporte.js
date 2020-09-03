process.env.NODE_ENV = "mocha";
const mongoose = require("mongoose");
var request = require("supertest");
var app = require("../app.js");
const { expect } = require("chai");

const Usuario = require("../dto/usuario-dto.js");
const Sorteo = require("../dto/sorteo-dto.js");

const reporteModel = require("_modelos/reporte-model");
const usuarioModel = require("_modelos/usuario-model");

const anError = (res) => {
  if (res.body.error) throw new Error(res.body.error);
};

/** @type {Usuario} */
var authMaster;
/** @type {Usuario} */
var authComercial;
/** @type {Array<Sorteo>} */
var sorteos;

before((done) => mongoose.connection.once("open", done));

describe("cargando datos", () => {
  it("limpiar", async () => {
    await reporteModel.deleteMany();
  });
  it("login master", (done) => {
    request(app)
      .post("/auth")
      .send({
        usuario: "master",
        clave: "m4ster.4dm1n",
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        authMaster = res.body;
        authMaster.token = {
          Authorization: `Bearer ${res.body.token}`,
        };
        done();
      });
  });
  it("login comercial", (done) => {
    request(app)
      .post("/auth")
      .send({
        usuario: "comercial2",
        clave: "654321",
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        authComercial = res.body;
        authComercial.token = {
          Authorization: `Bearer ${res.body.token}`,
        };
        done();
      });
  });
  it("leer sorteos", (done) => {
    request(app)
      .get("/sorteo/disponibles")
      .set(authComercial.token)
      .send({
        fecha: "2020-07-11",
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        sorteos = res.body;
        done();
      });
  });
  it.skip("premiar sorteo premiado: ERROR", function (done) {
    const sorteo = sorteos[11];
    request(app)
      .post("/sorteo/premiar")
      .set(authMaster.token)
      .send({
        sorteoId: sorteo._id,
        ganador: "14",
      })
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.ownProperty("error", "sorteo ya premiado");
        done();
      });
  });
  it("reiniciar sin permiso", () => {
    const sorteo = sorteos[15];
    request(app)
      .post("/sorteo/reiniciar")
      .set(authMaster.token)
      .send({
        sorteoId: sorteo._id,
        ganador: "12",
      })
      .expect(404);
  });
  it("reiniciar", (done) => {
    const sorteo = sorteos[15];
    request(app)
      .post("/sorteo/reiniciar")
      .set(authMaster.token)
      .send({
        sorteoId: sorteo._id,
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it("premiar", function (done) {
    this.timeout(5000);
    const sorteo = sorteos[15];
    request(app)
      .post("/sorteo/premiar")
      .set(authMaster.token)
      .send({
        sorteoId: "5f1cc031006a7a32f0d72bd3",
        ganador: "12",
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });

  it("reporte taquilla", async () => {
    const taquilla = await usuarioModel.findOne({ rol: "online" });
    request(app)
      .post(`/reporte/taquilla/${taquilla._id}`)
      .set(authComercial.token)
      .expect(200)
      .expect(anError)
      .then((res) => {
        expect(res.body).to.have.length.greaterThan(0);
      });
  });
  it.skip("reporte agencia", async () => {
    const agencia = await usuarioModel.findOne({ rol: "agencia" });
    request(app)
      .post(`/reporte/admin/${agencia._id}`)
      .set(authComercial.token)
      .expect(200)
      .expect(anError)
      .then((res) => {
        expect(res.body).to.have.length.greaterThan(0);
      });
  });
  it.skip("reporte grupo", async () => {
    const grupo = await usuarioModel.findOne({ rol: "grupo" });
    request(app)
      .post(`/reporte/admin/${grupo._id}`)
      .set(authComercial.token)
      .expect(200)
      .expect(anError)
      .then((res) => {
        expect(res.body).to.have.length.greaterThan(0);
      });
  });
  it.skip("reporte banca", async () => {
    const banca = await usuarioModel.findOne({ rol: "banca" });
    request(app)
      .post(`/reporte/admin/${banca._id}`)
      .set(authComercial.token)
      .expect(200)
      .expect(anError)
      .then((res) => {
        expect(res.body).to.have.length.greaterThan(0);
      });
  });
  it.skip("reporte comercial", async () => {
    const multi = await usuarioModel.findOne({ rol: "multi" });
    request(app)
      .post(`/reporte/admin/${multi._id}`)
      .set(authComercial.token)
      .expect(200)
      .expect(anError)
      .then((res) => {
        expect(res.body).to.have.length.greaterThan(0);
      });
  });
});
