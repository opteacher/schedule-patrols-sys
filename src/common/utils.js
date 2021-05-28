const $ = require('jquery')

module.exports = {
  async $For (select, cdFun = null) {
    let ret = []
    for (let i = 0; i < 500; ++i) {
      ret = $(select)
      if (ret.length) {
        if (cdFun && cdFun(ret)) {
          return Promise.resolve(ret)
        }
      }
      await new Promise(res => setTimeout(res, 200))
    }
    return Promise.resolve(ret)
  }
}