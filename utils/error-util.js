module.exports = {
  crearError(error) {
    if (error.error) {
      return error
    }
    else if (error.message) return {
      error: error.message
    }
    else if (error.errmsg) return {
      error: error.errmsg
    }
    else return {
      error
    }
  }
};