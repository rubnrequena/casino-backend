const router = require("express").Router();
const authService = require("../servicios/auth-service");
const { crearError } = require("../utils/error-util");
const { validarPOST, validarPermisos } = require("../middlewares");
const { AUTH_CLONAR_ROUTE_VALIDATION } = require("../middlewares/auth-middle");
var geoip = require("geoip-lite");
const sesionRepo = require("../repositorio/sesion-repo");
const Permiso = require("../dto/permiso.dto");

router.post("/", (req, res) => {
  let usuario = req.body.usuario;
  let clave = req.body.clave;
  usuario = usuario.toLowerCase();

  authService
    .login(usuario, clave)
    .then((usuario) => {
      res.json(usuario);
      //sesion
      var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      var geo = geoip.lookup(ip);
      sesionRepo.nueva(usuario._id, geo, req.useragent);
    })
    .catch((error) => {
      res.json({
        error,
      });
    });
});
router.post("/registro", async (req, res) => {
  let {
    nombre,
    usuario,
    clave,
    activo,
    correo,
    telefono,
    comision,
    participacion,
    utilidad,
    permisos,
    padre,
    rol,
    moneda,
  } = req.body;
  /*let jerarquia;
  if (padre) {
    let papa = await usuarioRepo.buscar.id(padre);
    if (!papa) return res.json(crearError("padre no existe"));
    jerarquia = [...papa.jerarquia, papa._id];
  } else jerarquia = [...req.user.jerarquia, req.user._id]; */
  authService
    .registro(
      padre || req.user._id,
      nombre,
      usuario,
      clave,
      activo,
      correo,
      telefono,
      comision,
      participacion,
      utilidad,
      permisos,
      rol,
      moneda
    )
    .then((usuario) => res.json(usuario))
    .catch((error) => res.json(crearError(error)));
});
router.post("/registro_online", (req, res) => {
  const { usuario, nombre, cedula, correo, clave } = req.body;
  authService
    .registro_online(usuario, nombre, cedula, correo, clave)
    .then((result) =>
      res.json(`Hemos enviado un correo a ${correo} para confirmar el registro`)
    )
    .catch((error) => res.json(crearError(error)));
});
router.post(
  "/clonar/:usuario",
  validarPOST(AUTH_CLONAR_ROUTE_VALIDATION),
  (req, res) => {
    const { usuario, clave, nombre, correo, telefono } = req.body;
    authService
      .clonar(usuario, clave, nombre, correo, telefono, req.params.usuario)
      .then((usuario) => {
        res.json(usuario);
      })
      .catch((error) => res.json(crearError(error)));
  }
);
router.post("/activar", validarPOST("codigo"), (req, res) => {
  authService
    .activar(req.body.codigo)
    .then(() => res.json("usuario activo"))
    .catch((error) => res.json(crearError(error)));
});

const validarPermisoNuevo = [
  validarPermisos(Permiso.permisos.crear),
  validarPOST("nombre,rol,predeterminado:boolean,permisos:array"),
];
router.post("/permiso/nuevo", validarPermisoNuevo, (req, res) => {
  const { nombre, rol, predeterminado, permisos, usuario } = req.body;
  authService.permisos
    .nuevo(nombre, rol, predeterminado, permisos, usuario)
    .then((permiso) => res.json(permiso))
    .catch((error) => res.json(crearError(error)));
});
router.get("/permiso/usuario", (req, res) => {
  authService.permisos.buscar
    .usuario(req.user)
    .then((permiso) => res.json(permiso))
    .catch((error) => res.json(crearError(error)));
});
module.exports = router;
