var request = require("supertest");
const sorteoModel = require("_modelos/sorteo-model");
const ticketModel = require("_modelos/ticket-model");
const usuarioModel = require("_modelos/usuario-model");
const ventaModel = require("_modelos/venta-model");
var app = require("../app.js");
const Usuario = require("../dto/usuario-dto.js");
const ticketService = require("../servicios/ticket-service.js");
const { getRandomInt } = require("../utils/number-util.js");
const anError = (res) => {
  if (res.body.error) throw new Error(JSON.stringify(res.body.error));
  return res;
};
const { generarVentas } = require("./dummyData.js");

let taquillas;

before(async () => {
  //await ticketModel.deleteMany();
  //await ventaModel.deleteMany();
  taquillas = await usuarioModel
    .find({
      jerarquia: "5f85dfa5b1fb533b90705e41",
      $or: [{ rol: Usuario.TAQUILLA }, { rol: Usuario.ONLINE }],
    })
    .lean();
  sorteos = await sorteoModel.find({ cierra: { $gt: new Date() } }).lean();
});

describe("ventas", () => {
  it("bulk local", async function () {
    this.timeout(0);
    const now = Date.now();
    let last = now;
    for (let i = 0; i <= 10; i++) {
      if (i % 1 == 0) {
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
      await ticketService.nuevo(taquilla, ventas);
    }
  });
});
