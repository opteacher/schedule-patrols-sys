const path = require('path')
const Koa = require('koa')
const bodyparser = require('koa-bodyparser')
const koaBody = require('koa-body')
const json = require('koa-json')
const logger = require('koa-logger')
const statc = require("koa-static")
const cors = require('koa2-cors')

const router = require('./router/index')
const models = require("./models/index").index

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
// 指定静态目录
app.use(statc(path.join(__dirname, "public")))
// 模型路由
app.use(models.routes(), models.allowedMethods())
// 路径分配
app.use(router.routes(), router.allowedMethods())

app.listen(process.env.PORT || 4000)
