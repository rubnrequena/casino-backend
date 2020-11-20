const { default: Axios } = require("axios");
const { expect } = require("chai");
const Sorteo = require("../dto/sorteo-dto");
const { getRandomInt, trailZero } = require("../utils/number-util");
const config = require("../config");

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

let numeros = [];
for (let i = 0; i <= 36; i++) {
  numeros.push(trailZero(i));
}

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
      /* await ticketModel.deleteMany();
      await ventaModel.deleteMany(); */
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
  it.skip("vender un solo ticket", function (done) {
    const venta = {
      numero: trailZero(getRandomInt(1, 36)),
      sorteo,
      monto: getRandomInt(10, 100) * 100,
    };
    Axios.post(url("ticket/venta"), [venta]).then((data) => {
      expect(data.data).have.not.ownProperty("error");
      done();
    });
  });
  it("vender lote", function (done) {
    len = 100;
    intervalo = len * 0.1;
    const hilos = 10;

    for (let x = 0; x < len; x++) {
      const nums = [];

      tickets.push([
        {
          numero: numeroAleatorio(nums),
          sorteo: sorteos[getRandomInt(0, sorteos.length - 1)]._id,
          monto: getRandomInt(10, 100) * 100,
        },
        {
          numero: numeroAleatorio(nums),
          sorteo: sorteos[getRandomInt(0, sorteos.length - 1)]._id,
          monto: getRandomInt(10, 100) * 100,
        },
        {
          numero: numeroAleatorio(nums),
          sorteo: sorteos[getRandomInt(0, sorteos.length - 1)]._id,
          monto: getRandomInt(10, 100) * 100,
        },
        {
          numero: numeroAleatorio(nums),
          sorteo: sorteos[getRandomInt(0, sorteos.length - 1)]._id,
          monto: getRandomInt(10, 100) * 100,
        },
      ]);
    }
    now = Date.now();
    for (let i = 0; i < hilos; i++) vender(done, vender);
  });
});

function vender(done, cb) {
  if (iventa >= tickets.length) return;
  const pos = usuarios[getRandomInt(0, 1)];
  Axios.defaults.headers.common["Authorization"] = pos.token;
  Axios.post(url("ticket/venta"), tickets[iventa++]).then((data) => {
    if (data.data.ticket) {
      vendidos++;
      ventasUsuario[pos.usuario] = ventasUsuario[pos.usuario] + 1;
    } else {
      rechazados++;
    }
    if (n % intervalo == 0) {
      console.log(`#${n} ${Date.now() - now}`);
      now = Date.now();
    }
    if (++n == len) {
      console.log({ vendidos, rechazados, ventasUsuario });
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
