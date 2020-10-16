const mongoose = require("mongoose");

function importTest(name, path) {
  describe(name, function () {
    require(path);
  });
}

describe("iniciando pruebas unitarias", function () {
  importTest("operadoras", "./2_operadoras.js");
  importTest("usuarios", "./3_usuarios.js");
  importTest("enlaces", "./4_enlaces.js");
  importTest("topes", "./5_topes.js");
  importTest("saldos", "./6_saldos.js");
  importTest("ventas", "./7_ventas.js");
  importTest("premiar", "./8_premiar.js");
  after(function () {
    console.log("test finalizados yay! 🎉");
  });
});
