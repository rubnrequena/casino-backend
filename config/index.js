const dotenv = require("dotenv");
// Set the NODE_ENV to 'development' by default
const isDev = process.env.NODE_ENV || "development";
console.log("NODE ENVIROMENT :>> ", isDev);

const env = dotenv.config();
if (env.error) {
  throw new Error("⚠️Couldn't find .env file⚠️");
}
module.exports = {
  databaseURL:
    isDev == "development"
      ? process.env.MONGODB_URI_DEV
      : process.env.MONGODB_URI_PROD,
  jwtSecret: process.env.JWT_SECRETO,
  baseUrl: process.env.BASE_URL,
  email: {
    apiKey: process.env.SMTP_USUARIO,
    domain: process.env.SMTP_CLAVE,
  },
  AGENTE_ONLINE: process.env.AGENTE_ONLINE,
};
