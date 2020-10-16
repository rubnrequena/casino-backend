var request = require("supertest");
var app = require("../app.js");
const anError = (res) => {
  if (res.body.error) throw new Error(JSON.stringify(res.body.error));
  return res;
};
const { init, login, token } = require("./common.js");
init(app, anError);

const reporteModel = require("_modelos/reporte-model");
const sorteoModel = require("_modelos/sorteo-model");
const ventaModel = require("_modelos/venta-model");
const Sorteo = require("../dto/sorteo-dto.js");
const Usuario = require("../dto/usuario-dto.js");
const Venta = require("../dto/venta-dto.js");

/** @type {Usuario} */
let master;

/** @type {Sorteo[]} */
let sorteos;
/** @type {Venta[]} */
let ventas;

before(async () => {
  await reporteModel.deleteMany();
  master = await login({ usuario: "master", clave: "1234" });
  const fecha = new Date().toISOString().substr(0, 10);
  sorteos = await sorteoModel.find({ fecha }).lean();
  ventas = await ventaModel.find().sort({ _id: -1 }).limit(1).lean();
});

describe("premiar", () => {
  it("reiniciar premio", function () {
    return request(app)
      .post("/sorteo/reiniciar")
      .set(token(master.token))
      .send({
        sorteo: ventas[0].sorteo,
      })
      .expect(200)
      .then(anError);
  });
  it("premiar", function () {
    this.timeout(0);
    return request(app)
      .post("/sorteo/premiar")
      .set(token(master.token))
      .send({
        sorteo: ventas[0].sorteo,
        numero: ventas[0].numero,
      })
      .expect(200)
      .then(anError);
  });
});
