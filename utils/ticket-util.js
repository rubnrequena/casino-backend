const redisRepo = require("../repositorio/redis-repo");
const { diaDelAnio } = require("./date-util");

const anioInicio = 2020;
const letras = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];

let numero = 1;

module.exports = {
  async ticketSerial() {
    let now = new Date(); //FIXME evitar tener que consultar la fecha cada momento
    let anio = letras[now.getFullYear() - anioInicio];
    let hora = now.getHours() < 10 ? `0${now.getHours()}` : now.getHours();
    const serial = `${anio}${diaDelAnio()}${hora}`;
    numero = await redisRepo.incrementar(serial);
    return `${serial}${numero}`;
  },
};
