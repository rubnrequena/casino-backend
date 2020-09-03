const util = require("util");
const mongoose = require("mongoose");

module.exports = {
  inspect(value, showHidden = false, depth = null) {
    return util.inspect(value, {
      showHidden,
      depth,
      colors: true,
    });
  },
  isObjectId(id) {
    return /^[a-f\d]{24}$/i.test(String(id));
  },
};
