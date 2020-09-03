//process.env.NODE_ENV = "mocha";
const mongoose = require("mongoose");
var request = require("supertest");
var app = require("../app.js");
const { expect } = require("chai");

const Usuario = require("../dto/usuario-dto.js");
const Sorteo = require("../dto/sorteo-dto.js");

const { generarVentas, generarVenta } = require("./dummyData.js");
const ticketModel = require("_modelos/ticket-model");
const redisRepo = require("../repositorio/redis-repo.js");
const { getRandomInt } = require("../utils/number-util.js");

const chalk = require("chalk");
const ticketService = require("../servicios/ticket-service.js");
const MetodoPago = require("../dto/metodo_pago-dto.js");
const metodo_pagoModel = require("_modelos/metodo_pago-model");
const Transaccion = require("../dto/transaccion-dto.js");
const transaccionModel = require("_modelos/transaccion-model");

const anError = (res) => {
  if (res.body.error) throw new Error(res.body.error);
};

/** @type {Usuario} */
var authOnline;
/** @type {Usuario} */
var authMaster;
/** @type {Array<Sorteo>} */
var sorteos;

before((done) => mongoose.connection.once("open", done));

describe("limpiar datos", () => {
  it("limpiar", async () => {
    //await ticketModel.deleteMany();
    //await ventaModel.deleteMany();
    //await redisRepo.flush();
    await metodo_pagoModel.deleteMany();
    await transaccionModel.deleteMany();
  });
});

describe("sesion", () => {
  it("login", (done) => {
    request(app)
      .post("/auth")
      .send({
        usuario: "online1",
        clave: "asd",
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
  it("login agente", (done) => {
    request(app)
      .post("/auth")
      .send({
        usuario: "agente2",
        clave: "asd",
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        authMaster2 = res.body;
        authMaster2.token = {
          Authorization: `Bearer ${res.body.token}`,
        };
        done();
      });
  });
  it("leer sorteos", (done) => {
    request(app)
      .get("/sorteo/disponibles")
      .set(authOnline.token)
      .send({
        fecha: "2020-07-20",
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        sorteos = res.body;
        done();
      });
  });
});

describe("saldo", () => {
  /** @type {MetodoPago} */
  let metodoPago;
  it("metodo pago", (done) => {
    request(app)
      .post("/saldo/metodopago/nuevo")
      .set(authOnline.token)
      .send({
        entidad: "BANESCO",
        direccion: "0134-1234-5678-00-1234",
        moneda: "ves",
        meta: "",
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        metodoPago = res.body;
        done();
      });
  });
  /** @type {Transaccion} */
  let recarga;
  it("recarga", (done) => {
    request(app)
      .post("/saldo/recarga")
      .set(authOnline.token)
      .send({
        monto: getRandomInt(100, 1000) * 1,
        metodo: metodoPago._id,
        mensaje: "recargar por favor",
        recibo: "1234",
        fecha: "2020-08-04",
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        recarga = res.body;
        done();
      });
  });
  it("procesar recarga", (done) => {
    request(app)
      .post("/saldo/procesar/")
      .set(authMaster2.token)
      .send({
        transaccion: recarga._id,
        usuario: authOnline._id,
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  /** @type {Transaccion} */
  let retiro;
  it("retiro", (done) => {
    request(app)
      .post("/saldo/retiro")
      .set(authOnline.token)
      .send({
        monto: getRandomInt(10, 100) * 1,
        metodo: metodoPago._id,
        mensaje: "dame mi dinero por favor",
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        retiro = res.body;
        done();
      });
  });
  it("procesar retiro", (done) => {
    request(app)
      .post("/saldo/procesar/")
      .set(authMaster2.token)
      .send({
        transaccion: retiro._id,
        usuario: authOnline._id,
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
});

describe("ventas 1", () => {
  it("venta", venderTicket);
});

describe("ventas 2", () => {
  it("venta", venderTicket);
});

function venderTicket(done) {
  const sorteo =
    sorteos.sorteos[
      getRandomInt(sorteos.sorteos.length - 3, sorteos.sorteos.length - 1)
    ];
  request(app)
    .post("/ticket/venta")
    .set(authOnline.token)
    .send([
      generarVenta(sorteo._id, getRandomInt(0, 36), getRandomInt(10, 100) * 10),
      generarVenta(sorteo._id, getRandomInt(0, 36), getRandomInt(10, 100) * 10),
    ])
    .expect(200)
    .expect(anError)
    .end((err, res) => {
      if (err) return done(err);
      done();
    });
}
