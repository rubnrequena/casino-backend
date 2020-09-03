// create certificate g-ssl.config.js

var { writeFileSync } = require("fs");
var { resolve } = require("path");
var selfsigned = require("selfsigned");
var chalk = require("chalk");

module.exports = {
  generar() {
    var gssl = selfsigned.generate(
      [{ name: "commonName", value: "localhost" }],
      {
        keySize: 2048,
        algorithm: "sha256",
        days: 90,
        clientCertificateCN: "localhost",
      }
    );

    writeFileSync(
      resolve(process.cwd(), "ssl/key.pem"),
      `${gssl.private}`,
      "utf8"
    );
    writeFileSync(
      resolve(process.cwd(), "ssl/cert.pem"),
      `${gssl.cert}`,
      "utf8"
    );

    console.log(chalk.green.bold("Generate Certificate SSL Succeffuly"));
  },
};
