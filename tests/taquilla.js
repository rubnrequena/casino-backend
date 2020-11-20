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
const { mapObject } = require("../utils/object-util.js");
const sorteoRepo = require("../repositorio/sorteo-repo.js");
const sorteoService = require("../servicios/sorteo-service.js");
init(app, anError);

/** @type {Usuario} */
let taquilla;
let authToken;
let operadoras;

function url(url, query) {
  query = mapObject(query, (campo, valor) => `${campo}=${valor}`).join("&");
  const uri = `/api/pos/${url}?${encodeURI(query)}`;
  return uri;
}

describe("prueba de API POS", () => {
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
    const hoy = isoDate();
    return request(app)
      .get(url("sorteo/disponibles", { fecha: hoy }))
      .set(authToken)
      .expect(200)
      .then(anError)
      .then((result) => {
        operadoras = result.body.operadoras;
        expect(operadoras).length.above(0);
        operadoras.forEach((operadora) => {
          expect(operadora.sorteos).length.above(0);
        });
      });
  });
  it("vender", async function () {
    const tickets = crearTickets(4);
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
  it("vender para anular", async function () {
    const tickets = crearTickets(4);
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
    const payload = { serial: ticketVendido.serial };
    return request(app)
      .get(url(`ticket/buscar`, payload))
      .set(authToken)
      .expect(200)
      .then(anError);
  });
  it("reporte ventas", async function () {
    const hoy = isoDate();
    return request(app)
      .get(url(`reporte/tickets`, { fecha: hoy, moneda: "ves" }))
      .set(authToken)
      .expect(200)
      .then(anError)
      .then((result) => result.body)
      .then((reporte) => {
        expect(reporte.tickets).length.above(0);
      });
  });
  it("anular", async function () {
    this.timeout(0);
    return request(app)
      .post(url("ticket/anular"))
      .set(authToken)
      .send({
        serial: ticketVendido.serial,
        codigo: ticketVendido.codigo,
      })
      .expect(200)
      .then(anError);
  });
  it("buscar ticket anulado", async function () {
    return request(app)
      .get(url(`ticket/buscar`, { serial: ticketVendido.serial }))
      .set(authToken)
      .expect(200)
      .then(anError)
      .then((result) => result.body)
      .then((ticket) => {
        expect(ticket.anulado).equal(true);
      });
  });
});

describe("premiar", () => {
  it("reiniciar sorteo", async function () {
    const operadora = operadoras[0];
    const sorteo = operadora.sorteos[operadora.sorteos.length - 1];
    return await sorteoService.reiniciar(sorteo._id);
  });
  it("premiar sorteo", async function () {
    this.timeout(0);
    const operadora = operadoras[0];
    const sorteo = operadora.sorteos[operadora.sorteos.length - 1];
    return await sorteoService.premiar(sorteo._id, getRandomInt(0, 36));
  });
});

describe("pagar tickets", () => {
  let ticketPremiado;
  it("buscar premiados", async function () {
    const hoy = isoDate();
    return request(app)
      .get(url(`reporte/tickets`, { fecha: hoy, moneda: "ves" }))
      .set(authToken)
      .expect(200)
      .then(anError)
      .then((result) => result.body)
      .then((reporte) => {
        expect(reporte.tickets).length.above(0);
        ticketPremiado = reporte.tickets.find(
          (ticket) => ticket.premiados.length > 0
        );
        console.log(ticketPremiado);
      });
  });
  it("pagar ticket", async function () {
    this.timeout(0);
    const numeroPremiado = ticketPremiado.premiados[0];
    return request(app)
      .post(url("ticket/pagar"))
      .set(authToken)
      .send({
        serial: ticketPremiado.serial,
        codigo: ticketPremiado.codigo,
        numero: numeroPremiado.numero,
      })
      .expect(200)
      .then(anError)
      .then((result) => result.body)
      .then((body) => {
        console.log(body);
      });
  });
});

describe("reportes", () => {
  it("reporte general", async function () {
    const hoy = isoDate();
    return request(app)
      .get(url("reporte/general", { desde: hoy, hasta: hoy, moneda: "ves" }))
      .set(authToken)
      .expect(200)
      .then(anError)
      .then((result) => result.body)
      .then((reportes) => {
        expect(reportes.reportes).length.above(0);
      });
  });
});

function crearTickets(n = 36) {
  const operadora = operadoras[0];
  const sorteo = operadora.sorteos[operadora.sorteos.length - 2];
  let jugadas = [];
  for (let i = 0; i < n; i++) {
    jugadas.push({
      sorteo: sorteo._id,
      numero: trailZero(i),
      monto: getRandomInt(10, 100) * 100,
    });
  }
  return jugadas;
}
