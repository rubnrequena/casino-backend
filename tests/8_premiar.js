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
const { trailZero, getRandomInt } = require("../utils/number-util.js");
const { expect } = require("chai");

/** @type {Usuario} */
let master;

/** @type {Sorteo[]} */
let sorteos;
/** @type {Venta[]} */
let ventas;

before(async () => {
  await reporteModel.deleteMany({ fecha: { $gte: new Date("2020", 9, 26) } });
  master = await login({ usuario: "master", clave: "1234" });
  const fecha = new Date().toISOString().substr(0, 10);
  sorteos = await sorteoModel.find({ fecha }).lean();
  const now = new Date();
  sorteos = sorteos.filter((sorteo) => {
    return new Date(sorteo.cierra) > now;
  });
  /* sorteos = sorteos.filter((sorteo) => {
    return sorteo.operadora == "5f404c2b99166318ec20c508";
  }); */
});

describe("premiar", () => {
  it("reiniciar premio", async function () {
    expect(sorteos.length).greaterThan(0);
    for (let i = 0; i < sorteos.length; i++) {
      const sorteo = sorteos[i];
      await request(app)
        .post("/sorteo/reiniciar")
        .set(token(master.token))
        .send({
          sorteo: sorteo._id,
        })
        .expect(200)
        .then(anError);
    }
  });
  it("premiar", async function () {
    this.timeout(0);
    for (let i = 0; i < sorteos.length; i++) {
      const sorteo = sorteos[i];
      await request(app)
        .post("/sorteo/premiar")
        .set(token(master.token))
        .send({
          sorteo: sorteo._id,
          numero: trailZero(getRandomInt(0, 36)),
        })
        .expect(200)
        .then((result) => {
          if (result.body.error) console.error(result.body.error);
        });
    }
  });
});
