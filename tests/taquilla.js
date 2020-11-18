var request = require("supertest");
var app = require("../app.js");
const { expect } = require("chai");
const Ticket = require("../dto/ticket-dto.js");
const Usuario = require("../dto/usuario-dto.js");
const { getRandomInt, trailZero } = require("../utils/number-util.js");
const { isoDate } = require("../utils/date-util");
const anError = (res) => {
  expect(res.body).to.haveOwnProperty("error");
  if (res.body.error != "OK") throw new Error(JSON.stringify(res.body.error));
  return res;
};
const { init, login, token } = require("./common.js");
init(app, anError);

/** @type {Usuario} */
let taquilla;
let authToken;
let operadoras;

function url(url) {
  return `/api/pos/${url}`;
}

describe("iniciar sesion", () => {
  /** @type {Ticket} */ let ticketVendido;
  it("login", async () => {
    return request(app)
      .post(url("auth"))
      .send({
        usuario: "pos1",
        clave: "1234",
      })
      .expect(200)
      .expect(anError)
      .then((result) => {
        taquilla = result.body;
        authToken = token(taquilla.token);
      });
  });
  it("sorteos disponibles", function () {
    return request(app)
      .get(url("sorteo/disponibles"))
      .set(authToken)
      .expect(200)
      .then(anError)
      .then((result) => {
        operadoras = result.body;
      });
  });
  it("vender", async function () {
    const tickets = crearTickets(5);
    return request(app)
      .post(url("ticket/venta"))
      .set(authToken)
      .send(tickets)
      .expect(200)
      .then(anError)
      .then((result) => result.body)
      .then((ticket) => {
        ticketVendido = ticket.ticket;
      });
  });
  it("buscar ticket", async function () {
    return request(app)
      .get(url(`ticket/buscar?serial=${ticketVendido.serial}`))
      .set(authToken)
      .expect(200)
      .then(anError);
  });
  it("reporte ventas", async function () {
    const hoy = isoDate();
    return request(app)
      .get(url(`reporte/tickets?fecha="${hoy}&moneda=ves`))
      .set(authToken)
      .expect(200)
      .then(anError)
      .then((result) => result.body)
      .then((reporte) => {
        expect(reporte.tickets).length.above(0);
      });
  });
  it("anular", async function () {
    return request(app)
      .post(url("ticket/anular"))
      .set(authToken)
      .send({
        serial: ticketVendido.serial,
        codigo: ticketVendido.codigo,
      })
      .expect(200)
      .then(anError)
      .then((result) => result.body)
      .then((body) => {});
  });
  it("buscar ticket anulado", async function () {
    return request(app)
      .get(url(`ticket/buscar?serial=${ticketVendido.serial}`))
      .set(authToken)
      .expect(200)
      .then(anError)
      .then((result) => result.body)
      .then((ticket) => {
        expect(ticket.anulado).equal(true);
      });
  });
});

function crearTickets(n) {
  const operadora = operadoras[0];
  const sorteo = operadora.sorteos[operadora.sorteos.length - 1];
  let jugadas = [];
  for (let i = 0; i < n; i++) {
    jugadas.push({
      sorteo: sorteo._id,
      numero: trailZero(getRandomInt(0, 36)),
      monto: getRandomInt(10, 100) * 100,
    });
  }
  return jugadas;
}
