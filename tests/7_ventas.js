var request = require("supertest");
var app = require("../app.js");
const anError = (res) => {
  if (res.body.error) throw new Error(JSON.stringify(res.body.error));
  return res;
};
const { init, login } = require("./common.js");
init(app, anError);

const { expect } = require("chai");

const Sorteo = require("../dto/sorteo-dto.js");
const Usuario = require("../dto/usuario-dto.js");
const { usuarios } = require("./usuarios.data.js");
const { ventas } = require("./data.js");
const sorteoModel = require("_modelos/sorteo-model");
const ticketModel = require("_modelos/ticket-model");
const ventaModel = require("_modelos/venta-model");

/** @type {Usuario[]} */
let posMap = [];
/** @type {Sorteo[]} */
let sorteos;

before(async function () {
  this.timeout(0);
  /* await ticketModel.deleteMany();
  await ventaModel.deleteMany(); */
  const hoy = new Date().toISOString().substr(0, 10);
  sorteos = await sorteoModel.find({ fecha: hoy });
});

describe("ventas", () => {
  it("inicio sesion", async function () {
    const posList = usuarios.pos;
    let pos = posList.shift();
    while (pos) {
      await login(pos).then((res) => posMap.push(res));
      pos = posList.shift();
    }
    expect(posMap).to.have.length(posMap.length);
  });
  it("vender taquilla", async function () {
    const pos1 = posMap[0];
    let ventasPOS = convertirSorteos(
      ventas.filter((pos) => pos.usuario == pos1.usuario)
    );

    let _ventas = ventasPOS.shift();
    while (_ventas) {
      await vender(pos1.token, _ventas.ventas);
      _ventas = ventasPOS.shift();
    }
  });

  it("venta online", async function () {
    const pos = posMap.find((pos) => pos.usuario == "online1");
    if (!pos) throw Error(`POS 'online1' no existe`);
    const _ventas = convertirSorteos(
      ventas.filter((item) => item.usuario == pos.usuario)
    );

    let venta = _ventas.shift();
    while (venta) {
      await vender(pos.token, venta.ventas);
      venta = _ventas.shift();
    }
  });
});

async function vender(token, ventas) {
  token = {
    Authorization: `Bearer ${token}`,
  };
  return await request(app)
    .post("/ticket/venta")
    .set(token)
    .send(ventas)
    .expect(200)
    .then(anError);
}

function convertirSorteos(ventas) {
  return ventas.map((venta) => {
    venta.ventas.map((venta) => {
      venta.sorteo = sorteos.find(
        (sorteo) => sorteo.descripcion == venta.sorteo
      )._id;
      return venta;
    });
    return venta;
  });
}
