const fs = require('fs')
const path = require('path')
const router = require('koa-router')()

const scanPath = require('../utils/tools').scanPath

// @block{userRoutes}:用户自定义路由
// @includes:path/../
// @includes:koa-router
// @includes:../utils/system.scanPath
console.log('API路由：')

// @steps{1}:扫描当前路径下除index.js以外的所有文件
const subPathAry = scanPath(__dirname, {ignores: ['index.js', 'schedule-patrols-sys/api/v1/common.js']})

// @steps{2}:根据各个文件相对路径，require之后开辟相应的路由
subPathAry.map(file => {
  const pthStat = path.parse(file)
  const preRoutePath = `/${pthStat.dir.replace(/\\/g, '/')}`
  const refIdx = require(`./${file}`)
  const content = fs.readFileSync(path.resolve(__dirname, file), 'utf8')
  for(let i = content.indexOf('router.'); i !== -1; i = content.indexOf('router.', i)) {
    i += 'router.'.length
    const bracket = content.indexOf('(', i)
    if(bracket === -1) {
      continue
    }
    const comma = content.indexOf(',', bracket)
    if(comma === -1) {
      continue
    }
    let subRoutePath = content.substring(bracket + 1, comma)
    subRoutePath = subRoutePath.substring(1, subRoutePath.length - 1)
    let routePath = ''
    if(subRoutePath !== '/') {
      routePath = preRoutePath + subRoutePath
    } else {
      routePath = preRoutePath
    }
    const method = content.substring(i, bracket).toLocaleUpperCase()
    console.log(`${method}\t${routePath}`)
  }
  router.use(preRoutePath, refIdx.routes(), refIdx.allowedMethods())
})

module.exports = router
