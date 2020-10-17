const moment = require("moment");

/**JSDoc
 * Convierte una fecha y hora a Date()
 * @param {String} fecha
 * @param {String} hora
 * @returns {Date}
 */
function parseDateString(fecha, hora) {
  const reg = /((?<ano>\d{4})-(?<mes>\d{1,2})-(?<dia>\d{1,2}))* ((?<hora>\d{1,2}):(?<minuto>\d{1,2})(:(?<segundos>\d{1,2}))* *(?<meridiano>[APM]+))*/gi;
  const { groups } = reg.exec(`${fecha} ${hora}`);
  let h =
    groups.meridiano.toLowerCase() == "am"
      ? groups.hora
      : parseInt(groups.hora == "12" ? 0 : groups.hora) + 12;
  return new Date(
    groups.ano,
    parseInt(groups.mes) - 1,
    groups.dia,
    h,
    groups.minuto
  );
}
/** Devuelve una cadena de la fecha en formato ISO
 * @param {Date=} date
 * @returns {String}
 */
function isoDate(date) {
  return formatDate(date, "YYYY-MM-DD");
}

function formatDate(date, format) {
  date = date || new Date();
  return moment(date).format(format);
}
/** @type {Number[]} */
var tiempo = [Date.now()];
async function medirTiempo(tag = "inicio") {
  console.log(`${tag} :>> `, Date.now() - tiempo[tiempo.length - 1]);
  tiempo.push(Date.now());
}
function diaDelAnio(date = new Date()) {
  return Math.floor(
    (date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
}

module.exports = {
  parseDateString,
  isoDate,
  formatDate,
  medirTiempo,
  diaDelAnio,
};
