const { expect } = require("chai");
var request = require("supertest");
const metodo_pagoModel = require("_modelos/metodo_pago-model");
const saldoModel = require("_modelos/saldo-model");
const transaccionModel = require("_modelos/transaccion-model");
var app = require("../app.js");
const MetodoPago = require("../dto/metodo_pago-dto.js");
const Transaccion = require("../dto/transaccion-dto.js");
const Usuario = require("../dto/usuario-dto.js");
const anError = (res) => {
  if (res.body.error) throw new Error(JSON.stringify(res.body.error));
  return res;
};
const { init, login, token } = require("./common.js");
const { usuarios } = require("./usuarios.data.js");
init(app, anError);

/** @type {Usuario} */
let online;
/** @type {Usuario} */
let agente;

/** @type {MetodoPago} */
let metodoPago_recarga;
/** @type {MetodoPago} */
let metodoPago_retiro;

/** @type {Transaccion} */
let transaccion;

before(async () => {
  await metodo_pagoModel.deleteMany();
  await saldoModel.deleteMany({ prevHash: { $ne: "genesis" } });
  await transaccionModel.deleteMany();

  online = usuarios.pos.find((usuario) => usuario.usuario == "online1");
  online = await login(online);

  agente = usuarios.comerciales.find((usuario) => usuario.usuario == "agente");
  agente = await login(agente);
});

describe("metodos de pago", () => {
  it("registrar para recargar", function () {
    return request(app)
      .post("/saldo/metodopago/nuevo")
      .set(token(agente.token))
      .send({
        entidad: "MERCANTIL",
        direccion: "0134-1234-5678-00-1234",
        moneda: online.moneda[0].siglas,
        meta: "META AQUI",
      })
      .expect(200)
      .then(anError)
      .then((res) => {
        metodoPago_recarga = res.body;
      });
  });
  it("registrar para retirar", function () {
    return request(app)
      .post("/saldo/metodopago/nuevo")
      .set(token(online.token))
      .send({
        entidad: "MERCANTIL",
        direccion: "0134-1234-5678-00-1234",
        moneda: online.moneda[0].siglas,
        meta: "META AQUI",
      })
      .expect(200)
      .then(anError)
      .then((res) => {
        metodoPago_retiro = res.body;
      });
  });
  it("remover metodo recarga", function () {
    return request(app)
      .post("/saldo/metodopago/remover")
      .set(token(online.token))
      .send({
        metodo: metodoPago_recarga._id,
      })
      .expect(200)
      .then(anError);
  });
  it("registrar para recargar", function () {
    return request(app)
      .post("/saldo/metodopago/nuevo")
      .set(token(agente.token))
      .send({
        entidad: "BANESCO",
        direccion: "0134-1234-5678-00-1234",
        moneda: online.moneda[0].siglas,
        meta: "META AQUI",
      })
      .expect(200)
      .then(anError)
      .then((res) => {
        metodoPago_recarga = res.body;
      });
  });
});

describe("saldos", () => {
  it("solicitar recarga", function () {
    return recargar({
      monto: 100000000,
      metodo: metodoPago_recarga._id,
      mensaje: "recargar por favor",
      recibo: "1234",
      fecha: new Date().toISOString().substr(0, 10),
    }).then((res) => (transaccion = res.body));
  });
  it("procesar recarga", function () {
    return request(app)
      .post("/saldo/procesar")
      .set(token(agente.token))
      .send({
        transaccion: transaccion._id,
      })
      .expect(200)
      .then(anError);
  });
  it("solicitar retiro", function () {
    return retirar({
      monto: 3000000,
      metodo: metodoPago_retiro._id,
      mensaje: "dame mi dinero por favor",
    }).then((res) => (transaccion = res.body));
  });
  it("procesar retiro", function () {
    return request(app)
      .post("/saldo/procesar")
      .set(token(agente.token))
      .send({ transaccion: transaccion._id })
      .expect(200)
      .then(anError);
  });
  it("verificar saldo", function () {
    return request(app)
      .get("/saldo/usuario")
      .set(token(online.token))
      .expect(200)
      .then(anError)
      .then((res) => {
        expect(res.body.balance).to.eql(97000000);
      });
  });
});

function recargar(recarga) {
  return request(app)
    .post("/saldo/recarga")
    .set(token(online.token))
    .send(recarga)
    .expect(200)
    .then(anError);
}
function retirar(retiro) {
  return request(app)
    .post("/saldo/retiro")
    .set(token(online.token))
    .send(retiro)
    .expect(200)
    .then(anError);
}
