var request = require("supertest");
const sorteoModel = require("_modelos/sorteo-model");
var app = require("../app.js");
const Usuario = require("../dto/usuario-dto.js");
const ticketService = require("../servicios/ticket-service.js");
const { getRandomInt } = require("../utils/number-util.js");
const anError = (res) => {
  if (res.body.error) throw new Error(JSON.stringify(res.body.error));
  return res;
};
const { generarVentas } = require("./dummyData.js");
const { init, login, token } = require("./common.js");
const { usuarios } = require("./usuarios.data.js");
const Sorteo = require("../dto/sorteo-dto.js");
init(app, anError);

let taquillas;
let tokens = [];
/** @type {Sorteo[]} */
let sorteos;

before(async () => {
  //await ticketModel.deleteMany();
  //await ventaModel.deleteMany();
  taquillas = usuarios.pos;
  sorteos = await sorteoModel.find({ cierra: { $gt: new Date() } }).lean();
});

describe("ventas", () => {
  it("login", async () => {
    for (let i = 0; i < taquillas.length; i++) {
      const taquilla = taquillas[i];
      const usuario = await login(taquilla);
      tokens[i] = token(usuario.token);
    }
  });
  it.skip("bulk local", function (done) {
    this.timeout(0);
    const now = Date.now();
    let last = now;
    let len = 10000;
    console.log(`Preparando ${len} tickets`);
    for (let i = 0; i <= len; i++) {
      if (i % 1000 == 0) {
        console.log(
          i,
          new Date().toLocaleTimeString(),
          Date.now() - now,
          Date.now() - last
        );
        last = Date.now();
      }
      let taquilla = taquillas[getRandomInt(0, taquillas.length - 1)];
      let ventas = generarVentas(5, sorteos, 2, sorteos.length - 1);
      ticketService
        .nuevo(taquilla, ventas)
        .then((result) => {
          console.log("hola", result);
          if (i == len) done();
        })
        .catch((error) => {
          console.error(error);
          done(error);
        });
    }
  });
  it("bulk 1000 request", function (done) {
    this.timeout(0);
    const now = Date.now();
    const lotData = [];
    for (let i = 0; i <= 100000; i++) {
      lotData.push({
        usuario: tokens[getRandomInt(0, tokens.length - 1)],
        venta: generarVentas(5, sorteos, 0, sorteos.length - 1),
      });
    }
    let aprobados = 0;
    let rechazados = 0;
    let n = 0;
    let last = Date.now();

    function sendRequest(venta, hilo) {
      if (!venta) return;
      request(app)
        .post("/ticket/venta")
        .set(venta.usuario)
        .send(venta.venta)
        .expect(200)
        .end((err, res) => {
          if (err) done(err);
          ++n;
          if (n % 1000 == 0) {
            const nw = Date.now();
            console.log(n, nw - now, nw - last);
            last = nw;
          }
          if (res.body.error) ++rechazados;
          else ++aprobados;
          if (n == lotData.length - 1) {
            done();
            console.log("tickets", {
              aprobados,
              rechazados,
            });
          } else sendRequest(lotData[n], hilo);
        });
    }
    sendRequest(lotData[0], "hilo1");
    sendRequest(lotData[1], "hilo2");
    sendRequest(lotData[2], "hilo3");
    sendRequest(lotData[3], "hilo4");
    sendRequest(lotData[4], "hilo5");
    sendRequest(lotData[5], "hilo6");
    sendRequest(lotData[6], "hilo7");
    sendRequest(lotData[7], "hilo8");
    sendRequest(lotData[8], "hilo9");
    sendRequest(lotData[9], "hilo10");
  });
});
