const Koa = require('koa')
const bodyparser = require('koa-bodyparser')
const koaBody = require('koa-body')
const json = require('koa-json')
const logger = require('koa-logger')
const cors = require('koa2-cors')

const router = require('./router/index')

const app = new Koa()

// 跨域配置
app.use(cors())
// 路径解析
app.use(bodyparser())
// 上传配置
app.use(koaBody({
  multipart: true,
  formidable: {
      maxFileSize: 200*1024*1024    // 设置上传文件大小最大限制，默认2M
  }
}))
// json解析
app.use(json())
// 日志输出
app.use(logger())
// 路径分配
app.use(router.routes(), router.allowedMethods())

app.listen(process.env.PORT || 4000)