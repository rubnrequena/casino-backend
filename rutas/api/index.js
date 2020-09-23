const router = require("express").Router();

const jwtService = require("../../servicios/jwt-service");

router.post("/auth", (req, res) => {
  let { usuario, nombre, agente, correo, telefono, cedula } = req.body;

  let token = jwtService.firmar({ usuario, nombre, correo, cedula });
  res.json({ url: `https//caribeapuesta.com/api/animal?key=${token}` });
});

module.exports = router;
