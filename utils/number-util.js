module.exports = {
  trailZero(n) {
    return n < 10 ? `0${n}` : n.toString();
  },
  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  formatoNumeroGanador(n) {
    if (n == "0" || n == "00") return n;
    else if (isNaN(Number(n))) return n;
    else return Number(n).toString();
  },
};
