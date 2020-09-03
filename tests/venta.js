//process.env.NODE_ENV = "mocha";
const mongoose = require("mongoose");
var request = require("supertest");
var app = require("../app.js");
const { expect } = require("chai");

const { resetRedis } = require("../lanzadores/database");

const Usuario = require("../dto/usuario-dto.js");
const Sorteo = require("../dto/sorteo-dto.js");

const { generarVentas, generarVenta } = require("./dummyData.js");
const ticketModel = require("_modelos/ticket-model");
const redisRepo = require("../repositorio/redis-repo.js");
const { getRandomInt } = require("../utils/number-util.js");
const ventaModel = require("_modelos/venta-model");
const chalk = require("chalk");
const ticketService = require("../servicios/ticket-service.js");
const usuarioModel = require("_modelos/usuario-model");

const anError = (res) => {
  if (res.body.error) throw new Error(res.body.error);
};

/** @type {Usuario} */
var authTaquilla;
/** @type {Usuario} */
var authTaquilla2;
/** @type {Usuario} */
var authOnline;
/** @type {Array<Sorteo>} */
var sorteos;

before(function (done) {
  this.timeout(0);
  mongoose.connection.once("open", () => {
    console.log("conectado a mongo");
    done();
  });
});

describe("limpiar datos", () => {
  it("ventas", async () => {
    console.log("iniciando");
    await ticketModel.deleteMany();
    await ventaModel.deleteMany();
    await redisRepo.flush();
    await resetRedis();
  });
});

describe("login", () => {
  it("login taquilla 1", (done) => {
    request(app)
      .post("/auth")
      .send({
        usuario: "taquilla",
        clave: "123456",
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        authTaquilla = res.body;
        authTaquilla.token = {
          Authorization: `Bearer ${res.body.token}`,
        };
        done();
      });
  });
  it("login taquilla 2", (done) => {
    request(app)
      .post("/auth")
      .send({
        usuario: "taquilla2",
        clave: "123456",
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        authTaquilla2 = res.body;
        authTaquilla2.token = {
          Authorization: `Bearer ${res.body.token}`,
        };
        done();
      });
  });
  it("login online", (done) => {
    request(app)
      .post("/auth")
      .send({
        usuario: "online",
        clave: "123456",
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        authOnline = res.body;
        authOnline.token = {
          Authorization: `Bearer ${res.body.token}`,
        };
        done();
      });
  });
  it("leer sorteos", (done) => {
    request(app)
      .get("/sorteo/disponibles")
      .set(authTaquilla.token)
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.sorteos).to.have.length.above(0);
        const ahora = Date.now();
        sorteos = res.body.sorteos.filter(
          (sorteo) => new Date(sorteo.cierra).getTime() > ahora
        );
        done();
      });
  });
});

describe("ventas", () => {
  it.skip("venta tq1: venta al 33<20.000 ✔️", (done) => {
    const sorteo = sorteos[10];
    request(app)
      .post("/ticket/venta")
      .set(authTaquilla.token)
      .send([generarVenta(sorteo._id, 33, 15000)])
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.not.have.ownProperty("error");
        done();
      });
  });
  it.skip("venta tq1: venta al 33>20.000 ❌", (done) => {
    const sorteo = sorteos[10];
    request(app)
      .post("/ticket/venta")
      .set(authTaquilla.token)
      .send([generarVenta(sorteo._id, 33, 15000)])
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.ownProperty("error");
        done();
      });
  });

  it.skip("venta tq1: venta al 20<50.000 sorteo:GRANJITA 11:30PM ✔️", (done) => {
    const sorteo = sorteos[16];
    request(app)
      .post("/ticket/venta")
      .set(authTaquilla.token)
      .send([generarVenta(sorteo._id, 20, 33000)])
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.not.have.ownProperty("error");
        done();
      });
  });
  it.skip("venta tq1: venta al 20>50.000 sorteo:GRANJITA 11:30PM ❌", (done) => {
    const sorteo = sorteos[16];
    request(app)
      .post("/ticket/venta")
      .set(authTaquilla.token)
      .send([generarVenta(sorteo._id, 20, 290000)])
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.ownProperty("error");
        done();
      });
  });

  it.skip("venta tq2: venta al 20<300.000:GRUPO ✔️", (done) => {
    const sorteo = sorteos[9];
    request(app)
      .post("/ticket/venta")
      .set(authTaquilla.token)
      .send([generarVenta(sorteo._id, 20, 190000)])
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.not.have.ownProperty("error");
        done();
      });
  });
  it.skip("venta tq2: venta al 20>300.000:GRUPO ❌", (done) => {
    const sorteo = sorteos[sorteos.length - 2];
    request(app)
      .post("/ticket/venta")
      .set(authTaquilla2.token)
      .send([generarVenta(sorteo._id, 20, 190000)])
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.ownProperty("error");
        done();
      });
  });
  it.skip("venta tq1: sorteo cerrado por tiempo: ❌", (done) => {
    const sorteo_cerrado = sorteos[0];
    const sorteo_abierto = sorteos[sorteos.length - 1];
    request(app)
      .post("/ticket/venta")
      .set(authTaquilla.token)
      .send([
        generarVenta(sorteo_abierto._id, 5, 5000),
        generarVenta(sorteo_cerrado._id, 10, 10000),
      ])
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.ownProperty("error");
        done();
      });
  });
  it.skip("venta tq1: sorteo cerrado por usuario: ❌", (done) => {
    const sorteo_abierto = sorteos[sorteos.length - 1];
    const sorteo_cerrado = sorteos[14];
    request(app)
      .post("/ticket/venta")
      .set(authTaquilla.token)
      .send([
        generarVenta(sorteo_abierto._id, 5, 5000),
        generarVenta(sorteo_cerrado._id, 10, 10000),
      ])
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.ownProperty("error");
        done();
      });
  });
  //bulk data
  it.skip("bulk 100 parallel", function (done) {
    this.timeout(0);
    const taquillas = [
      authTaquilla.token,
      authTaquilla2.token,
      authOnline.token,
    ];
    const lotData = [];
    for (let i = 0; i < 100; i++) {
      lotData.push({
        usuario: taquillas[getRandomInt(0, taquillas.length - 1)],
        venta: generarVentas(5, sorteos, 10, 12),
      });
    }
    let aprobados = 0,
      rechazados = 0;
    let n = 0;
    lotData.forEach((data, i) => {
      request(app)
        .post("/ticket/venta")
        .set(data.usuario)
        .send(data.venta)
        .expect(200)
        .end((err, res) => {
          n++;
          if (err) return done(err);
          if (res.body.error) ++rechazados;
          //console.log('req.body.error :>> ', res.body.error);
          else ++aprobados;
          if (n == lotData.length) {
            done();
            console.log("tickets", {
              aprobados,
              rechazados,
            });
          }
        });
    });
  });
  it.skip("bulk 100 request", function (done) {
    this.timeout(0);
    const now = Date.now();
    const taquillas = [
      authTaquilla.token,
      authTaquilla2.token,
      authOnline.token,
    ];
    const lotData = [];
    for (let i = 0; i < 1000; i++) {
      lotData.push({
        usuario: taquillas[getRandomInt(0, taquillas.length - 1)],
        venta: generarVentas(5, sorteos, 13, 16),
      });
    }
    let aprobados = 0;
    let rechazados = 0;
    let n = 0;

    function sendRequest(venta) {
      request(app)
        .post("/ticket/venta")
        .set(venta.usuario)
        .send(venta.venta)
        .expect(200)
        .end((err, res) => {
          ++n;
          if (err) return done(err);
          if (n.toString().indexOf("000") > -1)
            console.log("ticket", n, (Date.now() - now) / 1000);
          if (res.body.error) {
            ++rechazados;
            console.log(chalk.red("error :>> ", res.body.error));
          } else ++aprobados;
          if (n == lotData.length) {
            done();
            console.log("tickets", {
              aprobados,
              rechazados,
            });
          } else sendRequest(lotData[n]);
        });
    }
    sendRequest(lotData[0]);
    sendRequest(lotData[1]);
    sendRequest(lotData[2]);
    sendRequest(lotData[3]);
    sendRequest(lotData[4]);
    sendRequest(lotData[5]);
    sendRequest(lotData[6]);
    sendRequest(lotData[7]);
    sendRequest(lotData[8]);
    sendRequest(lotData[9]);
  });
  it("bulk local", async function () {
    this.timeout(0);
    let sorteosFiltro = sorteos;
    const taquillas = await usuarioModel.find({ rol: "taquilla" }).lean();
    for (let i = 0; i < 10000; i++) {
      let taquilla = taquillas[getRandomInt(0, taquillas.length - 1)];
      await ticketService.nuevo(
        taquilla,
        generarVentas(5, sorteosFiltro, 0, sorteosFiltro.length - 1)
      );
    }
  });
});
