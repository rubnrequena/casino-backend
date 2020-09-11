const authRouter = require("./auth-ruta");
const usuarioRouter = require("./usuario-ruta");
const operadoraRouter = require("./operadora-ruta");
const sorteoRouter = require("./sorteo-ruta");
const ticketRouter = require("./ticket-ruta");
const reporteRouter = require("./reporte-ruta");
const saldoRouter = require("./saldo-ruta");
const sistemaRouter = require("./sistema-ruta");
const hipismoRouter = require("./hipismo-ruta");
/**
 *
 * @param {import('express').IRouter} app
 */
module.exports = (app) => {
  app.use("/auth", authRouter);
  app.use("/usuario", usuarioRouter);
  app.use("/operadora", operadoraRouter);
  app.use("/sorteo", sorteoRouter);
  app.use("/ticket", ticketRouter);
  app.use("/reporte", reporteRouter);
  app.use("/saldo", saldoRouter);
  app.use("/sistema", sistemaRouter);
  app.use("/hipismo", hipismoRouter);
};
