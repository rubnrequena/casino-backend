const { default: Axios } = require("axios");
const { expect } = require("chai");
const Sorteo = require("../dto/sorteo-dto");
const { getRandomInt, trailZero } = require("../utils/number-util");
const config = require("../config");
const ticketModel = require("_modelos/ticket-model");
const ventaModel = require("_modelos/venta-model");

const url = (path) => {
  return `http://127.0.0.1:3000/${path}`;
};
let sorteo;
let ventas = [];
let iventa = 0;
let now;
let tickets = [];
let n = 0;
let intervalo;
let len;
/** @type {Sorteo[]} */
let sorteos;
let vendidos = 0;
let rechazados = 0;
let ventasUsuario = {};

let usuarios = [];
let inicioVentas;

let numeros = [];
for (let i = 0; i <= 36; i++) {
  numeros.push(trailZero(i));
}
let totalJugar = 0;
let totalJugado = 0;

before(async function () {
  this.timeout(0);
  const mongoose = require("mongoose");
  mongoose.connect(
    config.databaseURL,
    {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    },
    async (err) => {
      if (err) return err;
      await ticketModel.deleteMany();
      await ventaModel.deleteMany();
    }
  );
});

describe("pruebas", function () {
  this.timeout(0);
  it("login pos1", function (done) {
    Axios.post(url("auth"), { usuario: "pos1", clave: "1234" }).then(
      (result) => {
        if (result.data.error) return done(result.data.error);
        result.data.token = `Bearer ${result.data.token}`;
        usuarios.push(result.data);
        ventasUsuario[result.data.usuario] = 0;
        done();
      }
    );
  });
  it("login online1", function (done) {
    Axios.post(url("auth"), { usuario: "online1", clave: "1234" }).then(
      (result) => {
        if (result.data.error) return done(result.data.error);
        result.data.token = `Bearer ${result.data.token}`;
        usuarios.push(result.data);
        ventasUsuario[result.data.usuario] = 0;
        done();
      }
    );
  });
  it("sorteos", function (done) {
    Axios.defaults.headers.common["Authorization"] = usuarios[0].token;
    Axios.get(url(`sorteo/disponibles`))
      .then((result) => result.data)
      .then((data) => {
        /** @type {Sorteo[]} */
        sorteos = data.reduce((/** @type {Array} */ acc, operadora) => {
          return acc.concat(operadora.sorteos);
        }, []);
        const now = new Date();
        sorteos = sorteos.filter((sorteo) => {
          return new Date(sorteo.cierra) > now;
        });
        console.log("sorteos abiertos:", sorteos.length);
        expect(sorteos).length.above(0, "no hay sorteos disponibles");
        sorteo = sorteos[sorteos.length - 1]._id;
        expect(sorteos.length).greaterThan(0);
        done();
      })
      .catch((error) => {
        console.log(error.message);
      });
  });
  it("vender un solo ticket", function (done) {
    const ventas = [
      {
        numero: trailZero(getRandomInt(1, 36)),
        sorteo: '5fbbe3925121814adccce2fa',
        monto: 1000,
      },
      {
        numero: trailZero(getRandomInt(1, 36)),
        sorteo,
        monto: 1000,
      }
    ];
    Axios.post(url("api/pos/ticket/venta"), ventas).then((data) => {
      expect(data.data.error).eq("OK")
      console.log("un_tickey", data.data);
      done();
    }).catch(error => {
      done(error)
    })
  });
  it.skip("vender lote", function (done) {
    len = 1000;
    intervalo = len * 0.1;
    const hilos = 10;
    for (let x = 0; x < len; x++) {
      const _tickets = []
      const nums = [];
      for (let index = 0; index < 4; index++) {
        const monto = getRandomInt(10, 100) * 100
        totalJugar += monto;
        _tickets.push({
          numero: numeroAleatorio(nums),
          sorteo: sorteos[1]._id,
          monto,
        });
      }
      tickets.push(_tickets)
    }
    now = Date.now();
    inicioVentas = Date.now();
    for (let i = 0; i < hilos; i++) vender(done, vender);
  });
});

function vender(done, cb) {
  if (iventa >= tickets.length) return;
  const pos = usuarios[getRandomInt(0, 1)];
  Axios.defaults.headers.common["Authorization"] = pos.token;
  const ticket = tickets[iventa++]
  Axios.post(url("api/pos/ticket/venta"), ticket).then((data) => {
    if (data.data.ticket) {
      vendidos++;
      ventasUsuario[pos.usuario] = ventasUsuario[pos.usuario] + 1;
    } else {
      rechazados++;
      console.log(data.data.error);
    }
    if (n % intervalo == 0) {
      console.log(`#${n} ${Date.now() - now}`);
      now = Date.now();
    }
    if (++n == len) {
      console.log({ vendidos, rechazados, ventasUsuario });
      console.log('total enviado: ', totalJugar);
      return done();
    }
    cb(done, cb);
  });
}

function numeroAleatorio(/** @type {Number[]} */ nums) {
  let num;
  do {
    num = getRandomInt(0, 36);
  } while (nums.indexOf(num) > -1);
  nums.push(num);
  return num;
}
