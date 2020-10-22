const { default: Axios } = require("axios");
const { expect } = require("chai");
const Sorteo = require("../dto/sorteo-dto");
const { getRandomInt, trailZero } = require("../utils/number-util");

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

describe("pruebas", function () {
  this.timeout(0);
  it("login", function (done) {
    Axios.post(url("auth"), { usuario: "pos1", clave: "1234" }).then(
      (result) => {
        Axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${result.data.token}`;
        if (result.data.error) done(result.data.error);
        else done();
      }
    );
  });
  it("sorteos", function (done) {
    Axios.get(url(`sorteo/disponibles`))
      .then((result) => result.data)
      .then((data) => {
        /** @type {Sorteo[]} */
        const sorteos = data.sorteos;
        sorteo = sorteos[sorteos.length - 1]._id;
        done();
      });
  });
  it("vender un solo ticket", function (done) {
    const venta = {
      numero: trailZero(getRandomInt(1, 36)),
      sorteo,
      monto: getRandomInt(10, 100) * 100,
    };
    Axios.post(url("ticket/venta"), [venta]).then((data) => {
      console.log("ticket vendido", data.data.ticket.serial);
      done();
    });
  });
  it("vender lote", function (done) {
    len = 10000;
    intervalo = len * 0.1;
    const hilos = 20;

    for (let x = 0; x < len; x++) {
      tickets.push([
        {
          numero: trailZero(getRandomInt(1, 36)),
          sorteo,
          monto: getRandomInt(10, 100) * 100,
        },
        {
          numero: trailZero(getRandomInt(1, 36)),
          sorteo,
          monto: getRandomInt(10, 100) * 100,
        },
        {
          numero: trailZero(getRandomInt(1, 36)),
          sorteo,
          monto: getRandomInt(10, 100) * 100,
        },
        {
          numero: trailZero(getRandomInt(1, 36)),
          sorteo,
          monto: getRandomInt(10, 100) * 100,
        },
      ]);
    }
    now = Date.now();
    for (let i = 0; i < hilos; i++) vender(done, vender);
  });
});

function vender(done, cb) {
  Axios.post(url("ticket/venta"), tickets[iventa++]).then((data) => {
    //console.log(hilo, "ticket", `#${n}`, data.data.ticket.serial);
    ventas.push(data.data.ticket.serial);
    if (n % intervalo == 0) {
      console.log(`#${n} ${Date.now() - now}`);
      now = Date.now();
    }
    if (++n == len) return done();
    cb(done, cb);
  });
}
