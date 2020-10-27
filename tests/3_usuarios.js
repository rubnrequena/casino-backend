//process.env.NODE_ENV = "mocha";
var request = require("supertest");
var app = require("../app.js");
const anError = (res) => {
  if (res.body.error) throw new Error(res.body.error);
  return res;
};
const { init, login, token } = require("./common.js");
init(app, anError);

const Usuario = require("../dto/usuario-dto.js");

const usuarioModel = require("_modelos/usuario-model");
const data = require("./usuarios.data");
const authService = require("../servicios/auth-service.js");
const saldoModel = require("_modelos/saldo-model");
const grupo_pagoModel = require("_modelos/grupo_pago-model");
const operadora_pagaModel = require("_modelos/operadora_paga-model");
const Operadora = require("../dto/operadora-dto.js");
const operadoraModel = require("_modelos/operadora-model");
const GrupoPago = require("../dto/grupo_pago-model.js");
const comisionModel = require("_modelos/comision.model");
const { assert } = require("chai");

/** @type {Usuario} */
let master = {};

let usuarios = {};

/** @type {GrupoPago[]} */
let gruposPago = [];

/** @type {Operadora[]} */
let operadoras;

before(async function () {
  this.timeout(0);
  await usuarioModel.deleteMany({ rol: { $ne: "master" } });
  await saldoModel.deleteMany();
  await grupo_pagoModel.deleteMany();
  await operadora_pagaModel.deleteMany();
  await comisionModel.deleteMany();
  operadoras = await operadoraModel.find().lean();
});

describe("probando master", () => {
  it("iniciar sesion", (done) => {
    request(app)
      .post("/auth")
      .send({
        usuario: "master",
        clave: "1234",
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        master = res.body;
        usuarios["master"] = master._id;
        master.token = {
          Authorization: `Bearer ${res.body.token}`,
        };
        done();
      });
  });
});

describe("registrar administradores", () => {
  it("registro comerciales", (done) => {
    const _usuarios = data.usuarios.comerciales;
    registrarTest(_usuarios)
      .then(done)
      .catch((error) => done(error));
  });
  it("registro bancas", (done) => {
    const _usuarios = data.usuarios.bancas;
    registrarTest(_usuarios)
      .then(done)
      .catch((error) => done(error));
  });
  it("registro grupos", (done) => {
    const _usuarios = data.usuarios.grupos;
    registrarTest(_usuarios)
      .then(done)
      .catch((error) => done(error));
  });
  it("sesion comerciales", (done) => {
    const _usuarios = data.usuarios.comerciales;
    loginTest(_usuarios)
      .then((res) => {
        done();
      })
      .catch((error) => done(error));
  });
  it("sesion bancas", (done) => {
    const _usuarios = data.usuarios.bancas;
    loginTest(_usuarios)
      .then(done)
      .catch((error) => done(error));
  });
  it("sesion grupos", (done) => {
    const _usuarios = data.usuarios.grupos;
    loginTest(_usuarios)
      .then(done)
      .catch((error) => done(error));
  });
});

describe("registrar grupos de pago", () => {
  it("comercial", async function () {
    const comercial = await login({ usuario: "comercial", clave: "1234" });
    return request(app)
      .post("/operadora/grupopago/nuevo")
      .set(master.token)
      .send({
        nombre: "T600,60,30",
        descripcion: "PAGO TRIPLES TERMINALES Y ANIMALITOS",
        usuario: comercial._id,
      })
      .expect(200)
      .then(anError)
      .then((res) => gruposPago.push(res.body));
  });
  it("agente", async function () {
    const agente = await login({ usuario: "agente", clave: "1234" });
    return request(app)
      .post("/operadora/grupopago/nuevo")
      .set(master.token)
      .send({
        nombre: "T700,70,35",
        descripcion: "PAGO TRIPLES TERMINALES Y ANIMALITOS",
        usuario: agente._id,
      })
      .expect(200)
      .then(anError)
      .then((res) => gruposPago.push(res.body));
  });
});

describe("registrar pos", () => {
  it("registro agencias", (done) => {
    const _usuarios = data.usuarios.agencias;
    registrarTest(_usuarios)
      .then(done)
      .catch((error) => done(error));
  });
  it("registro pos", function (done) {
    const grupoPago = gruposPago.find((grupo) => grupo.nombre == "T700,70,35");
    const _usuarios = data.usuarios.pos;
    registrarTest(_usuarios, grupoPago)
      .then(done)
      .catch((error) => done(error));
  });
  it("sesion agencias", (done) => {
    const _usuarios = data.usuarios.agencias;
    loginTest(_usuarios)
      .then(done)
      .catch((error) => done(error));
  });
  it("sesion pos", (done) => {
    const _usuarios = data.usuarios.pos;
    loginTest(_usuarios)
      .then(done)
      .catch((error) => done(error));
  });
});

describe("asignar grupos de pago", () => {
  it("registrar", async function () {
    let grupo = gruposPago.shift();
    while (grupo) {
      for (let i = 0; i < operadoras.length; i++) {
        const operadora = operadoras[i];
        await request(app)
          .post("/operadora/usuario/paga/nuevo")
          .set(master.token)
          .send({
            operadora: operadora._id,
            grupo: grupo._id,
            monto: operadora.paga + 10,
          })
          .expect(200)
          .then(anError);
      }
      grupo = gruposPago.shift();
    }
  });
});

describe("comisiones", function () {
  this.timeout(0);
  it("registrar comisiones", async function () {
    const comisiones = {
      master: 0,
      multi: 20,
      banca: 19,
      grupo: 18,
      agencia: 17,
      taquilla: 16,
      agente: 20,
      online: 0,
    };
    const participaciones = {
      master: 0,
      multi: 40,
      banca: 30,
      grupo: 20,
      agencia: 10,
      taquilla: 0,
      agente: 40,
      online: 0,
    };
    /** @type {Usuario[]} */
    let comerciales = await usuarioModel.find();
    for (let x = 0; x < comerciales.length; x++) {
      const usuario = comerciales[x];
      let com;
      let part;
      for (let i = 0; i < operadoras.length; i++) {
        const operadora = operadoras[i];
        com = comisiones[usuario.rol];
        part = participaciones[usuario.rol];
        await comision(operadora._id, usuario._id, com, part, 0);
      }
    }
  });
  it("eliminar comisiones", function () {});
  it("remover comisiones", function () {});
});

/**
 * @param {Usuario} usuario
 * @returns {Promise<Usuario>}
 */
async function registrar_usuario(usuario) {
  return await request(app)
    .post("/auth/registro")
    .set(master.token)
    .send({ ...usuario, padre: usuarios[usuario.padre] })
    .expect(200)
    .then(anError);
}
function registrarTest(_usuarios, grupoPago) {
  return new Promise((resolve, reject) => {
    const len = _usuarios.length;
    let registrados = 0;
    _usuarios.forEach((usuario) => {
      usuario.grupoPago = grupoPago;
      registrar_usuario(usuario)
        .then((res) => {
          usuarios[usuario.usuario] = res.body._id;
          registrados++;
          if (registrados == len) resolve();
        })
        .catch((error) => reject(error));
    });
  });
}
function loginTest(_usuarios) {
  return new Promise(async (resolve, reject) => {
    const len = _usuarios.length;
    let indice = 0;
    let usuario;
    do {
      usuario = _usuarios[indice];
      await login(usuario)
        .then(() => indice++)
        .catch((error) => {
          reject(error);
        });
    } while (indice < len);
    resolve();
  });
}

async function comision(operadora, usuario, comision, participacion, utilidad) {
  assert.isNumber(comision, usuario);
  return await request(app)
    .post("/usuario/comision/registro")
    .set(master.token)
    .send({
      operadora,
      usuario,
      comision,
      participacion,
      utilidad,
    })
    .expect(200)
    .then(anError);
}
