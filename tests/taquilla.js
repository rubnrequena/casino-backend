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
const { init, token } = require("./common.js");
const { mapObject } = require("../utils/object-util.js");
const sorteoRepo = require("../repositorio/sorteo-repo.js");
const sorteoService = require("../servicios/sorteo-service.js");
const OperadoraSorteo = require("../dto/operadora-sorteo.dto.js");
init(app, anError);

let authToken;
/** @type {Usuario} */
let taquilla;
/** @type {OperadoraSorteo[]} */
let operadoras;
let sorteo;

let tickets;
let numerosVendidos = []

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
      .send({ usuario: "pos1", clave: "1234" })
      .expect(200)
      .expect(anError)
      .then((result) => {
        taquilla = result.body;
        authToken = token(taquilla.token);
      });
  });
  it('cambiar clave', async function () {
    const payload = { actual: "1234", nueva: "4321" }
    return request(app).post(url('auth/cambiarclave')).set(authToken)
      .send(payload)
      .expect(200)
      .then(anError)
  });
  it('reestablecer contraseña', async function () {
    const payload = { actual: "4321", nueva: "1234" }
    return request(app).post(url('auth/cambiarclave')).set(authToken)
      .send(payload)
      .expect(200)
      .then(anError)
  });
  it('generar caja', async function () {
    this.timeout(0)
    return request(app).get(url('reporte/caja/generar')).set(authToken)
      .expect(200)
      .then(anError)
      .then(result => result.body).then(body => {
        console.log(JSON.stringify(body));
      })
  });
  it('reporte de caja', async function () {
    const fecha = isoDate()
    return request(app).get(url('reporte/caja', { fecha: "2020-12-03" })).set(authToken)
      .expect(200)
      .then(anError)
      .then(result => result.body).then(body => {
        expect(body.reportes).to.have.length.above(0);
      })
  });
  it.skip("sorteos disponibles", function () {
    const hoy = isoDate();
    return request(app)
      .get(url("sorteo/disponibles", { fecha: hoy }))
      .set(authToken)
      .expect(200)
      .then(anError)
      .then((result) => {
        operadoras = result.body.operadoras;
        expect(operadoras).length.above(0);
        const operadora = operadoras.find(o => o.sorteos.length > 0);
        sorteo = operadora.sorteos[operadora.sorteos.length - 1];
        console.log('sorteo seleccionado: ', sorteo.descripcion);
      });
  });
  it.skip('sorteos', async function () {
    const payload = {
      fecha: isoDate(),
      operadora: operadoras[0]._id
    }
    return request(app).get(url('sorteo/buscar', payload)).set(authToken)
      .expect(200)
      .then(anError)
  });

  it.skip("validar", async function () {
    this.timeout(0)
    tickets = crearTickets(5);
    return request(app)
      .post(url("ticket/validar"))
      .set(authToken)
      .send(tickets)
      .expect(200)
      .then(anError)
      .then((result) => result.body)
      .then((ticket) => {
        ticketVendido = ticket.ticket;
      });
  });
  it.skip("vender", async function () {
    this.timeout(0)
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
  it.skip("buscar ticket", async function () {
    const payload = { serial: 'A12037' };
    return request(app)
      .get(url(`ticket/buscar`, payload))
      .set(authToken)
      .expect(200)
      .then(anError).then(result => result.body)
      .then(ticket => {
        console.log("ticket: >> ", ticket);
      })
  });
});
describe.skip('anular', () => {
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
      .then(anError)
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

describe.skip("premiar", function () {
  this.timeout(0)
  it("reiniciar sorteo", async function () {
    return await sorteoService.reiniciar(sorteo._id);
  });
  it("premiar sorteo", async function () {
    const ganador = numerosVendidos[0, numerosVendidos.length - 1]
    return await sorteoService.premiar(sorteo._id, ganador)
  });
});

describe.skip("pagar tickets", function () {
  this.timeout(0)
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
        ticketPremiado = reporte.tickets.filter(
          (ticket) => ticket.premiados.length > 0
        ).pop()
      });
  });
  it("pagar ticket", async function () {
    const numeroPremiado = ticketPremiado.premiados[ticketPremiado.premiados.length - 1];
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

describe.skip("reportes", () => {
  it('', async function () {
    return request(app).get(url('reporte/tickets', { fecha: "2020-12-02", estado: "vendidos", moneda: 'ves' })).set(authToken)
      .expect(200)
      .then(anError)
      .then(result => result.body).then(reporte => {
        console.log("tickets >> ", reporte.tickets.length);
      })
  });
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
  /* const operadora = operadoras.find(o => o.sorteos.length > 0);
  const sorteo = operadora.sorteos[getRandomInt(0, operadora.sorteos.length - 1)]; */
  let jugadas = [];
  for (let i = 0; i < n; i++) {
    const numero = getRandomInt(0, 36);
    numerosVendidos.push(numero)
    jugadas.push({
      sorteo: sorteo._id,
      monto: getRandomInt(10, 100) * 1000,
      numero,
    });
  }
  return jugadas;
}
