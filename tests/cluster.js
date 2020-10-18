const { default: Axios } = require("axios");
const { expect } = require("chai");
const Sorteo = require("../dto/sorteo-dto");
const { getRandomInt, trailZero } = require("../utils/number-util");

const url = (path) => {
  return `http://51.83.141.121:3000/${path}`;
};
let sorteo;
let ventas = [];

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
  it("vender un ticket", function (done) {
    const venta = {
      numero: trailZero(getRandomInt(1, 36)),
      sorteo,
      monto: getRandomInt(10, 100) * 100,
    };
    Axios.post(url("ticket/venta"), [venta]).then((data) => {
      console.log(data.data.ticket.serial);
      done();
    });
  });
  it("vender", function (done) {
    let n = 0;
    const len = 100;
    let tickets = [];
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
    for (let i = 0; i < len; i++) {
      Axios.post(url("ticket/venta"), [tickets[i]]).then((data) => {
        ventas.push(data.data.ticket.serial);
        if (++n == len) {
          done();
        }
      });
    }
  });
});
