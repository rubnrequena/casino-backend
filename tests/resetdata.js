const anuladoModel = require("_modelos/anulado-model");
const comisionModel = require("_modelos/comision.model");
const enlace_operadoraModel = require("_modelos/enlace_operadora-model");
const grupo_pagoModel = require("_modelos/grupo_pago-model");
const metodo_pagoModel = require("_modelos/metodo_pago-model");
const operadora_pagaModel = require("_modelos/operadora_paga-model");
const permisoModel = require("_modelos/permiso-model");
const premioModel = require("_modelos/premio-model");
const saldoModel = require("_modelos/saldo-model");
const sessionModel = require("_modelos/session-model");
const sorteoModel = require("_modelos/sorteo-model");
const ticketModel = require("_modelos/ticket-model");
const topeModel = require("_modelos/tope-model");
const transaccionModel = require("_modelos/transaccion-model");
const usuarioModel = require("_modelos/usuario-model");
const ventaModel = require("_modelos/venta-model");
const pagadoModel = require("_modelos/pagado-model");

require("../app.js");

describe("usuarios", () => {
  it("usuarios", async function () {
    await usuarioModel.remove();
    await topeModel.remove();
    await permisoModel.remove();
    await comisionModel.remove();
    await grupo_pagoModel.remove();
    await sessionModel.remove();
  });

  it("saldos", async function () {
    await metodo_pagoModel.remove();
    await saldoModel.remove();
    await transaccionModel.remove();
  });
});

describe("operadoras y sorteos", () => {
  it("sorteos", async function () {
    await sorteoModel.remove();
    await operadora_pagaModel.remove();
    await enlace_operadoraModel.remove();
  });
});

describe("ventas", () => {
  it("tickets", async function () {
    await ticketModel.remove();
    await ventaModel.remove();
    await premioModel.remove();
    await anuladoModel.remove();
    await pagadoModel.remove();
  });
});
