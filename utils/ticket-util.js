const redisRepo = require("../repositorio/redis-repo");
const { trailZero } = require("./number-util");

const anioInicio = 2020;
const letras = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];

let numero = 1;

module.exports = {
  async ticketSerial() {
    //TODO: hacer cache de la fecha, y validarla cada hora
    let now = new Date();
    let anio = letras[now.getFullYear() - anioInicio];
    let mes = trailZero(now.getMonth() + 1);
    let dia = trailZero(now.getDate());
    const serial = `${anio}${mes}${dia}`;
    numero = await redisRepo.incrementar(serial);
    return `${serial}${numero}`;
  },
};
