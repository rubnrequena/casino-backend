const config = require("./config/index");
const lanzadores = require("./lanzadores/index");

var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const useragent = require("express-useragent");

const { authJWT } = require("./middlewares/auth-middle");

var app = express();
app.use(cors());
app.use(helmet());
app.use(useragent.express());

if (process.env.NODE_ENV == "development") app.use(logger("dev"));
app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(authJWT);
require("./rutas/index")(app);

lanzadores.database.conectar().then(() => {
  lanzadores.database.verificarDatosIniciales();
});

module.exports = app;
