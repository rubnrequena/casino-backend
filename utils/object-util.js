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
  /**
   *
   * @param {Object} obj
   * @param {Function} cb
   * @returns {Array}
   */
  mapObject(obj, cb) {
    let acc = [];
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const element = obj[key];
        acc.push(cb(key, element));
      }
    }
    return acc;
  },
};
