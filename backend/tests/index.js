//process.env.NODE_ENV = "mocha";
const mongoose = require("mongoose");
var request = require("supertest");
var app = require("../app.js");
const { expect } = require("chai");
const md5 = require("md5");
const moment = require("moment");
const { getRandomInt } = require("../utils/number-util");

const Usuario = require("../dto/usuario-dto.js");
const Operadora = require("../dto/operadora-dto.js");
const Sorteo = require("../dto/sorteo-dto.js");

const usuarioModel = require("_modelos/usuario-model");
const sorteoModel = require("_modelos/sorteo-model");
const operadoraModel = require("_modelos/operadora-model");
const topeModel = require("_modelos/tope-model");
const anError = (res) => {
  if (res.body.error) throw new Error(res.body.error);
};

const { generadorTope } = require("./dummyData.js");
const Tope = require("../dto/tope-dto.js");
const enlace_operadoraModel = require("_modelos/enlace_operadora-model");
const transaccionModel = require("_modelos/transaccion-model");
const saldoModel = require("_modelos/saldo-model");
const juegoModel = require("_modelos/juego-model");
const metodo_pagoModel = require("_modelos/metodo_pago-model");
const permisoModel = require("_modelos/permiso-model");
const Permiso = require("../dto/permiso.dto.js");
const redisRepo = require("../repositorio/redis-repo.js");
const { resetRedis } = require("../lanzadores/database");

var authMaster;
/** @type {Usuario} */
var authComercial;
/** @type {Usuario} */
var authComercial2;
/** @type {Usuario} */
var authBanca;
/** @type {Usuario} */
var authGrupo;
/** @type {Usuario} */
var authAgencia;
/** @type {Usuario} */
var authTaquilla;
/** @type {Usuario} */
var authOnline;
/** @type {Usuario} */
var authAgente;

/** @type {Operadora} */
var operadora_GRANJITA;
/** @type {Operadora} */
var operadora_LOTTORD;
/** @type {Array<Sorteo>} */
var sorteos_GRANJITA;
/** @type {Array<Sorteo>} */
var sorteos_LOTTORD;
/** @type {Tope} */
var tope_GRANJITA;
/** @type {Tope} */
var tope_LOTTORD;

let permisoAdministrador;
let permisoMaster;
let permisoAgente;

before(function (done) {
  this.timeout(0);
  mongoose.connection.once("open", done);
});

describe("limpiar base datos", () => {
  it("usuarios", async () => {
    await redisRepo.flush();
    await usuarioModel.deleteMany();
    await enlace_operadoraModel.deleteMany();
    await saldoModel.deleteMany();
    await transaccionModel.deleteMany();
    await metodo_pagoModel.deleteMany();
    await permisoModel.deleteMany();
    permisoAdministrador = new permisoModel({
      nombre: "comercial",
      permisos: Permiso.admin(),
      rol: "comercial",
      predeterminado: true,
    });
    permisoAdministrador.save();
    permisoMaster = new permisoModel({
      nombre: "master",
      permisos: Permiso.master(),
      rol: "master",
      predeterminado: true,
    });
    await permisoMaster.save();
    permisoAgente = new permisoModel({
      nombre: "agente",
      permisos: Permiso.agente(),
      rol: "agente",
      predeterminado: true,
    });
    await permisoAgente.save();
    await resetRedis();
  });
  it("operadoras", async () => {
    await operadoraModel.deleteMany();
    await sorteoModel.deleteMany();
    await topeModel.deleteMany();
    await juegoModel.deleteMany();
  });
});
describe("auth", () => {
  it("registrar maestro", (done) => {
    const clave = md5("m4ster.4dm1n");
    new usuarioModel({
      activo: true,
      papelera: false,
      jerarquia: [],
      comision: 0,
      participacion: 0,
      moneda: "ves",
      nombre: "Master 01",
      usuario: "master",
      clave,
      rol: "master",
      correo: "rubnrequena@gmail.com",
      telefono: "643322341",
      permisos: permisoMaster,
      codigo: "0",
      __v: 0,
    }).save((error, master) => {
      if (error) return done(error);
      done();
    });
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
});
describe("init", () => {
  it("juego nuevo", (done) => {
    request(app)
      .post("/sistema/juego/nuevo")
      .set(authMaster.token)
      .send({ nombre: "Animalitos" })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.ownProperty("_id");
        done();
      });
  });
  it("listar juegos", (done) => {
    request(app)
      .get("/sistema/juegos")
      .set(authMaster.token)
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.length.at.above(0);
        done();
      });
  });
});
describe("usuarios", () => {
  it("registrar comercial", (done) => {
    request(app)
      .post("/auth/registro")
      .set(authMaster.token)
      .send({
        usuario: "comercial",
        nombre: "EL Comercial",
        clave: "123456",
        rol: "multi",
        activo: true,
        correo: "rubnrequena@gmail.com",
        telefono: "34643322341",
        comision: 20,
        participacion: 25,
        permisos: permisoAgente._id,
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it("login comercial", (done) => {
    request(app)
      .post("/auth")
      .send({
        usuario: "comercial",
        clave: "123456",
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
  it("registrar comercial", (done) => {
    request(app)
      .post("/auth/registro")
      .set(authMaster.token)
      .send({
        usuario: "comercial2",
        nombre: "EL Comercial master2",
        clave: "123456",
        rol: "multi",
        activo: true,
        correo: "rubnrequena@gmail.com",
        telefono: "34643322341",
        comision: 30,
        participacion: 50,
        permisos: permisoAdministrador._id,
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it("login comercial2", (done) => {
    request(app)
      .post("/auth")
      .send({
        usuario: "comercial2",
        clave: "123456",
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        authComercial2 = res.body;
        authComercial2.token = {
          Authorization: `Bearer ${res.body.token}`,
        };
        done();
      });
  });
  it("registrar banca", (done) => {
    request(app)
      .post("/auth/registro")
      .set(authComercial.token)
      .send({
        usuario: "banca",
        nombre: "La Banca",
        clave: "123456",
        rol: "banca",
        activo: true,
        correo: "rubnrequena@gmail.com",
        telefono: "34643322341",
        comision: 20,
        participacion: 25,
        permisos: permisoAdministrador._id,
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it("login banca", (done) => {
    request(app)
      .post("/auth")
      .send({
        usuario: "banca",
        clave: "123456",
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        authBanca = res.body;
        authBanca.token = {
          Authorization: `Bearer ${res.body.token}`,
        };
        done();
      });
  });
  it("registrar grupo 1", (done) => {
    request(app)
      .post("/auth/registro")
      .set(authBanca.token)
      .send({
        usuario: "grupo",
        nombre: "El Grupo",
        clave: "123456",
        rol: "grupo",
        activo: true,
        correo: "rubnrequena@gmail.com",
        telefono: "34643322341",
        comision: 15,
        participacion: 25,
        permisos: permisoAdministrador._id,
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it("registrar grupo 2", (done) => {
    request(app)
      .post("/auth/registro")
      .set(authBanca.token)
      .send({
        usuario: "grupo2",
        nombre: "El Grupo",
        clave: "123456",
        rol: "grupo",
        activo: true,
        correo: "rubnrequena@gmail.com",
        telefono: "34643322341",
        comision: 15,
        participacion: 50,
        permisos: permisoAdministrador._id,
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it("login grupo 1", (done) => {
    request(app)
      .post("/auth")
      .send({
        usuario: "grupo",
        clave: "123456",
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        authGrupo = res.body;
        authGrupo.token = {
          Authorization: `Bearer ${res.body.token}`,
        };
        done();
      });
  });
  it("login grupo 2", (done) => {
    request(app)
      .post("/auth")
      .send({
        usuario: "grupo2",
        clave: "123456",
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        authGrupo2 = res.body;
        authGrupo2.token = {
          Authorization: `Bearer ${res.body.token}`,
        };
        done();
      });
  });
  it("registrar agencia 1", (done) => {
    request(app)
      .post("/auth/registro")
      .set(authGrupo.token)
      .send({
        usuario: "agencia",
        nombre: "Agencia",
        clave: "123456",
        rol: "agencia",
        activo: true,
        correo: "rubnrequena@gmail.com",
        telefono: "34643322341",
        comision: 12,
        participacion: 25,
        permisos: permisoAdministrador._id,
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it("registrar agencia 2", (done) => {
    request(app)
      .post("/auth/registro")
      .set(authGrupo2.token)
      .send({
        usuario: "agencia2",
        nombre: "Agencia 2",
        clave: "123456",
        rol: "agencia",
        activo: true,
        correo: "rubnrequena@gmail.com",
        telefono: "34643322341",
        comision: 12,
        participacion: 0,
        permisos: permisoAdministrador._id,
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it("login agencia 1", (done) => {
    request(app)
      .post("/auth")
      .send({
        usuario: "agencia",
        clave: "123456",
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        authAgencia = res.body;
        authAgencia.token = {
          Authorization: `Bearer ${res.body.token}`,
        };
        done();
      });
  });
  it("login agencia 2", (done) => {
    request(app)
      .post("/auth")
      .send({
        usuario: "agencia2",
        clave: "123456",
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        authAgencia2 = res.body;
        authAgencia2.token = {
          Authorization: `Bearer ${res.body.token}`,
        };
        done();
      });
  });
  it("registrar taquilla 1", (done) => {
    request(app)
      .post("/auth/registro")
      .set(authAgencia.token)
      .send({
        usuario: "taquilla",
        nombre: "Taquilla",
        clave: "123456",
        rol: "taquilla",
        activo: true,
        correo: "rubnrequena@gmail.com",
        telefono: "34643322341",
        comision: 10,
        permisos: permisoAdministrador._id,
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it("registrar taquilla 2", (done) => {
    request(app)
      .post("/auth/registro")
      .set(authAgencia.token)
      .send({
        usuario: "taquilla2",
        nombre: "Taquilla 02",
        clave: "123456",
        rol: "taquilla",
        activo: true,
        correo: "rubnrequena@gmail.com",
        telefono: "34643322341",
        comision: 10,
        permisos: permisoAdministrador._id,
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it("registrar taquilla 3", (done) => {
    request(app)
      .post("/auth/registro")
      .set(authAgencia2.token)
      .send({
        usuario: "taquilla3",
        nombre: "Taquilla 03",
        clave: "123456",
        rol: "taquilla",
        activo: true,
        correo: "rubnrequena@gmail.com",
        telefono: "34643322341",
        permisos: permisoAdministrador._id,
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it("login taquilla", (done) => {
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
  it("registrar agente", (done) => {
    request(app)
      .post("/auth/registro")
      .set(authMaster.token)
      .send({
        usuario: "agente",
        nombre: "Agente 01",
        clave: "123456",
        rol: "agente",
        activo: true,
        correo: "rubnrequena@gmail.com",
        telefono: "34643322341",
        permisos: permisoAdministrador._id,
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it("login agente", (done) => {
    request(app)
      .post("/auth")
      .send({
        usuario: "agente",
        clave: "123456",
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        authAgente = res.body;
        authAgente.token = {
          Authorization: `Bearer ${res.body.token}`,
        };
        done();
      });
  });
  it("registrar online", (done) => {
    request(app)
      .post("/auth/registro")
      .set(authAgente.token)
      .send({
        usuario: "online",
        nombre: "Online 01",
        clave: "123456",
        rol: "online",
        activo: true,
        correo: "rubnrequena@gmail.com",
        telefono: "34643322341",
        permisos: permisoAdministrador._id,
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
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
  it("random users", function (done) {
    this.timeout(0);
    let comerciales = [],
      bancas = [],
      grupos = [],
      agencias = [],
      taquillas = [],
      onlines = [];
    for (let i = 0; i < 5; i++) {
      comerciales.push({
        usuario: `comercial_${i}`,
        nombre: `comercial_${i}`,
        clave: "123456",
        rol: "multi",
        activo: true,
        correo: "rubnrequena@gmail.com",
        telefono: "643322341",
        comision: 20,
        participacion: 25,
        padre: authMaster._id,
        permisos: permisoAdministrador._id,
      });
    }
    makeRequests(comerciales, () => {
      console.log("generando comerciales");
      for (let i = 0; i < 30; i++) {
        bancas.push({
          usuario: `banca${i}`,
          nombre: `banca${i}`,
          clave: "123456",
          rol: "banca",
          activo: true,
          correo: "rubnrequena@gmail.com",
          telefono: "643322341",
          comision: 20,
          participacion: 25,
          padre: comerciales[getRandomInt(0, comerciales.length - 1)]._id,
          permisos: permisoAdministrador._id,
        });
      }
      makeRequests(bancas, () => {
        console.log("generando bancas");
        for (let i = 0; i < 90; i++) {
          grupos.push({
            usuario: `grupos${i}`,
            nombre: `grupos${i}`,
            clave: "123456",
            rol: "grupo",
            activo: true,
            correo: "rubnrequena@gmail.com",
            telefono: "643322341",
            comision: 20,
            participacion: 25,
            padre: bancas[getRandomInt(0, bancas.length - 1)]._id,
            permisos: permisoAdministrador._id,
          });
        }
        makeRequests(grupos, () => {
          console.log("generando grupos");
          for (let i = 0; i < 120; i++) {
            agencias.push({
              usuario: `agencia_${i}`,
              nombre: `agencia_${i}`,
              clave: "123456",
              rol: "agencia",
              activo: true,
              correo: "rubnrequena@gmail.com",
              telefono: "643322341",
              comision: 20,
              participacion: 25,
              padre: grupos[getRandomInt(0, grupos.length - 1)]._id,
              permisos: permisoAdministrador._id,
            });
          }
          makeRequests(agencias, () => {
            for (let i = 0; i < 240; i++) {
              taquillas.push({
                usuario: `taquilla_${i}`,
                nombre: `taquilla_${i}`,
                clave: "123456",
                rol: "taquilla",
                activo: true,
                correo: "rubnrequena@gmail.com",
                telefono: "643322341",
                comision: 20,
                participacion: 25,
                padre: agencias[getRandomInt(0, grupos.length - 1)]._id,
                permisos: permisoAdministrador._id,
              });
            }
            makeRequests(taquillas, () => {
              done();
            });
          });
        });
      });
    });

    function makeRequests(usuarios, cb) {
      let contador = 0;
      let usuario = usuarios[contador];
      req(usuario, cb);

      function req(usuario, cb) {
        request(app)
          .post("/auth/registro")
          .set(authMaster.token)
          .send(usuario)
          .expect(200)
          .expect(anError)
          .end((err, res) => {
            if (err) return done(err);
            usuarios[contador++] = res.body;
            if (contador == usuarios.length) cb();
            else req(usuarios[contador], cb);
          });
      }
    }
  });
});
describe("metodos de pago", () => {
  it("nuevo metodo pago", (done) => {
    request(app)
      .post("/saldo/metodopago/nuevo")
      .set(authAgente.token)
      .expect(200)
      .expect(anError)
      .send({
        entidad: "BANESCO",
        direccion: "0134-1234-5678-00-1234",
        meta: "Miguel Dummit\nCedula: 01234568\nCuenta Corriente",
        moneda: "ves",
      })
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it("metodos pago del usuario", (done) => {
    request(app)
      .get("/saldo/metodopago/buscar/todos")
      .set(authAgente.token)
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.length(1);
        done();
      });
  });
  it("metodos pago padre", (done) => {
    request(app)
      .get("/saldo/metodopago/recargar")
      .set(authOnline.token)
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.length(1);
        done();
      });
  });
});
describe("operadoras", () => {
  it("crear operadora GRANJITA", (done) => {
    request(app)
      .post("/operadora/nueva")
      .set(authMaster.token)
      .send({
        nombre: "GRANJITA INT",
        tipo: Operadora.ANIMAL,
        paga: 30,
        sorteos: [
          "09:30 AM",
          "10:30 AM",
          "11:30 AM",
          "12:30 PM",
          "01:30 PM",
          "02:30 PM",
          "03:30 PM",
          "04:30 PM",
          "05:30 PM",
          "06:30 PM",
          "07:30 PM",
          "08:30 PM",
          "09:30 PM",
        ],
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        operadora_GRANJITA = res.body;
        done();
      });
  });
  it("crear operadora LOTTO RD", (done) => {
    request(app)
      .post("/operadora/nueva")
      .set(authMaster.token)
      .send({
        nombre: "LOTTO RD",
        tipo: Operadora.ANIMAL,
        paga: 30,
        sorteos: [
          "00:01 AM",
          "05:30 AM",
          "09:30 AM",
          "10:30 AM",
          "11:30 AM",
          "12:30 PM",
          "01:30 PM",
          "02:30 PM",
          "03:30 PM",
          "04:30 PM",
          "05:30 PM",
          "06:30 PM",
          "07:30 PM",
          "08:30 PM",
          "09:30 PM",
          "10:30 PM",
          "11:30 PM",
          "11:59 PM",
        ],
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        operadora_LOTTORD = res.body;
        done();
      });
  });
  it("registrar sorteos GRANJITA", (done) => {
    request(app)
      .post("/sorteo/nuevo")
      .set(authMaster.token)
      .send({
        fecha: moment().format("YYYY-MM-DD"),
        operadora: operadora_GRANJITA._id,
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        sorteos_GRANJITA = res.body;
        done();
      });
  });
  it("registrar sorteos LOTTO RD", (done) => {
    request(app)
      .post("/sorteo/nuevo")
      .set(authMaster.token)
      .send({
        fecha: moment().format("YYYY-MM-DD"),
        operadora: operadora_LOTTORD._id,
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        sorteos_LOTTORD = res.body;
        done();
      });
  });
  it.skip(`cerrar sorteo por usuario`, (done) => {
    let sorteo = sorteos_GRANJITA[sorteos_GRANJITA.length - 3];
    request(app)
      .get(`/sorteo/cerrar/${sorteo._id}`)
      .set(authMaster.token)
      .expect(200)
      .expect(anError)
      .end(async (err, res) => {
        if (err) return done(err);
        sorteo = await sorteoModel.findById(sorteo._id);
        expect(sorteo.abierta).to.be.equal(false);
        done();
      });
  });
  it("cerrar sorteo", (done) => {
    let sorteo = sorteos_GRANJITA[sorteos_GRANJITA.length - 1];
    request(app)
      .get(`/sorteo/cerrar/${sorteo._id}`)
      .set(authMaster.token)
      .expect(200)
      .expect(anError)
      .end(async (err, res) => {
        if (err) return done(err);
        sorteo = await sorteoModel.findById(sorteo._id);
        expect(sorteo.abierta).to.be.equal(false);
        done();
      });
  });
  it("abrir sorteo", (done) => {
    let sorteo = sorteos_GRANJITA[sorteos_GRANJITA.length - 1];
    request(app)
      .get(`/sorteo/abrir/${sorteo._id}`)
      .set(authMaster.token)
      .expect(200)
      .expect(anError)
      .end(async (err, res) => {
        if (err) return done(err);
        sorteo = await sorteoModel.findById(sorteo._id);
        expect(sorteo.abierta).to.be.equal(true);
        done();
      });
  });
  it("error al abrir sorteo pasado de hora", (done) => {
    let sorteo = sorteos_LOTTORD[0];
    request(app)
      .get(`/sorteo/abrir/${sorteo._id}`)
      .set(authMaster.token)
      .expect(200)
      .end(async (err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.ownProperty("error");
        done();
      });
  });
});
describe("enlazar usuarios a operadoras", () => {
  it("crear enlace agencia", (done) => {
    request(app)
      .post("/operadora/enlace/nuevo")
      .set(authComercial.token)
      .send({
        usuario: authAgencia._id,
        operadora: operadora_GRANJITA._id,
        mostrar: true,
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it("crear enlace comercial:online", (done) => {
    request(app)
      .post("/operadora/enlace/nuevo")
      .set(authAgente.token)
      .send({
        usuario: authAgente._id,
        operadora: operadora_GRANJITA._id,
        mostrar: true,
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it("crear enlace comercial:online", (done) => {
    request(app)
      .post("/operadora/enlace/nuevo")
      .set(authAgente.token)
      .send({
        usuario: authAgente._id,
        operadora: operadora_LOTTORD._id,
        mostrar: true,
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it("crear enlace comercial:online", (done) => {
    request(app)
      .post("/operadora/enlace/nuevo")
      .set(authAgente.token)
      .send({
        usuario: authOnline._id,
        operadora: operadora_LOTTORD._id,
        mostrar: false,
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it("crear enlace comercial", (done) => {
    request(app)
      .post("/operadora/enlace/nuevo")
      .set(authComercial.token)
      .send({
        usuario: authComercial._id,
        operadora: operadora_GRANJITA._id,
        mostrar: false,
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it("crear enlace duplicado comercial RECHAZADO", (done) => {
    request(app)
      .post("/operadora/enlace/nuevo")
      .set(authComercial.token)
      .send({
        usuario: authComercial._id,
        operadora: operadora_GRANJITA._id,
        mostrar: false,
      })
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.ownProperty(
          "error",
          "Error: Enlace duplicado"
        );
        done();
      });
  });
});
describe("topes", () => {
  it("registrar tope agente", (done) => {
    const sorteo = sorteos_GRANJITA[0];
    request(app)
      .post("/sorteo/tope/nuevo")
      .set(authAgente.token)
      .send(generadorTope(sorteo.operadora, authAgente, null, null, 100000))
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it("registrar tope comercial", (done) => {
    const sorteo = sorteos_GRANJITA[0];
    request(app)
      .post("/sorteo/tope/nuevo")
      .set(authComercial.token)
      .send(
        generadorTope(sorteo.operadora, authComercial, null, null, 10000000)
      )
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it("registrar tope banca", (done) => {
    const sorteo = sorteos_GRANJITA[0];
    request(app)
      .post("/sorteo/tope/nuevo")
      .set(authComercial.token)
      .send(
        generadorTope(sorteo.operadora, authBanca, null, null, 400, 400, 1000)
      )
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it("registrar tope grupo", (done) => {
    const sorteo = sorteos_GRANJITA[0];
    request(app)
      .post("/sorteo/tope/nuevo")
      .set(authComercial.token)
      .send(
        generadorTope(sorteo.operadora, authGrupo, null, null, 300, 300, 1000)
      )
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it("registrar tope agencia", (done) => {
    const sorteo = sorteos_GRANJITA[0];
    request(app)
      .post("/sorteo/tope/nuevo")
      .set(authComercial.token)
      .send(generadorTope(sorteo.operadora, authAgencia, null, null, 30))
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        tope_GRANJITA = res.body;
        done();
      });
  });
  it("registrar tope agencia LOTTO_RD", (done) => {
    const sorteo = sorteos_LOTTORD[0];
    request(app)
      .post("/sorteo/tope/nuevo")
      .set(authComercial.token)
      .send(
        generadorTope(sorteo.operadora, authAgencia, null, null, 0, 0, 1000)
      )
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        tope_LOTTORD = res.body;
        done();
      });
  });
  it("editar tope", (done) => {
    request(app)
      .post("/sorteo/tope/editar")
      .set(authComercial.token)
      .send({
        topeId: tope_GRANJITA._id,
        campos: {
          activo: false,
        },
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it.skip("registrar tope agencia con numero: 33", (done) => {
    const sorteo = sorteos_GRANJITA[0];
    request(app)
      .post("/sorteo/tope/nuevo")
      .set(authComercial.token)
      .send(generadorTope(sorteo.operadora, authAgencia, null, "33", 20))
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it.skip("registrar tope agencia con sorteo", (done) => {
    const sorteo = sorteos_GRANJITA[sorteos_GRANJITA.length - 1];
    request(app)
      .post("/sorteo/tope/nuevo")
      .set(authComercial.token)
      .send(generadorTope(sorteo.operadora, authAgencia, sorteo._id, null, 50))
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it.skip("registrar tope agencia con sorteo y numero: 30", (done) => {
    const sorteo = sorteos_GRANJITA[sorteos_GRANJITA.length - 1];
    request(app)
      .post("/sorteo/tope/nuevo")
      .set(authComercial.token)
      .send(generadorTope(sorteo.operadora, authAgencia, sorteo._id, "30", 0))
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
  it.skip("remover tope", (done) => {
    request(app)
      .post(`/sorteo/tope/remover/${tope_GRANJITA._id}`)
      .set(authComercial.token)
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
});
describe("manipular usuarios", () => {
  it('"master2" no puede editar comercial de "master"', () => {
    request(app)
      .post("/usuario/editar")
      .set(authMaster.token)
      .send({
        usuario: authComercial._id,
        editar: {
          activo: false,
        },
      })
      .expect(401);
  });
  it("editar comercial", (done) => {
    request(app)
      .post("/usuario/editar")
      .set(authMaster.token)
      .send({
        usuario: authComercial._id,
        editar: {
          nombre: "El mejor comercial",
          correo: "comercial@gmail.com",
        },
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.ownProperty("nombre", "El mejor comercial");
        done();
      });
  });
  it("editar banca", (done) => {
    request(app)
      .post("/usuario/editar")
      .set(authMaster.token)
      .send({
        usuario: authBanca._id,
        editar: {
          activo: false,
        },
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.ownProperty("activo", false);
        done();
      });
  });
  it("cambiar contraseña comercial", (done) => {
    request(app)
      .post("/usuario/cambiar_clave")
      .set(authMaster.token)
      .send({
        usuario: authComercial._id,
        clave: "654321",
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.ownProperty("n", 1);
        done();
      });
  });
  it("clonar taquilla", (done) => {
    request(app)
      .post(`/auth/clonar/${authAgencia._id}`)
      .set(authComercial.token)
      .send({
        usuario: "taquilla_clon",
        nombre: "taquilla clon",
        clave: "1234",
        correo: "clon@correo.com",
        telefono: "123456789",
      })
      .expect(200)
      .expect(anError)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
});
