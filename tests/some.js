const sorteoModel = require("_modelos/sorteo-model");
const { conectar } = require("../lanzadores/database");
const { cache, del } = require("../repositorio/redis-repo");
const sorteoRepo = require("../repositorio/sorteo-repo");
const usuarioRepo = require("../repositorio/usuario-repo");

function cachePromise(id) {
  return sorteoRepo.buscar.id(id);
}
before((done) => {
  conectar().then(done);
});

describe("redis cache", () => {
  it("mongo", async () => {
    const now = Date.now();
    await cache("hola", "mundo", () =>
      sorteoRepo.buscar.id("5f89906bfdb82421609db18e")
    );
    console.log(Date.now() - now);
  });
  it("redis", async () => {
    const now = Date.now();
    await cache("hola", "mundo", () =>
      sorteoRepo.buscar.id("5f89906bfdb82421609db18e")
    );
    console.log(Date.now() - now);
  });
  it("clear", async function () {
    await del("hola");
  });
});
