const _ = require('lodash')
const router = require('koa-router')()
const path = require('path')
const ExcelJS = require('exceljs')

const tools = require('../../../../../utils/tools')
const db = tools.getDatabase()
const {Patrol} = require(path.join(tools.rootPath(), 'models/index'))
const {genPatrolData} = require('../common')

router.post('/gene', async ctx => {
  const month = (new Date()).getMonth() + 1
  const patrol = await genPatrolData(month)
  ctx.body = {
    result: patrol
  }
})

router.get('/export/excel', async ctx => {
  const month = (new Date()).getMonth() + 1
  const array = await db.select(Patrol, {month})
  if (!array.length) {
    ctx.body = {
      error: '请先生成当月巡逻勤务！'
    }
    return
  }
  const patrol = array[0]

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet()
  worksheet.columns = patrol.columns.map(column => ({
    key: column.key,
    header: column.title,
    width: _.toInteger(column.width / 5)
  }))
  for (const record of patrol.data) {
    worksheet.addRow({
      A: record.date,
      B: record.week,
      C: record.east.length ? record.east.join('\n') : '',
      D: record.west.length ? record.west.join('\n') : '',
      E: record.norm.length ? record.norm.join('\n') : '',
    }, 'i').commit()
  }
  // worksheet.commit()
  const routePath = path.join(
    'schedule-patrols-sys', 'static', 'exports',
    `${month}月份责任区街面勤务安排.xlsx`
  )
  const excelPath = path.join(tools.rootPath(), 'public', routePath)
  await workbook.xlsx.writeFile(excelPath)
  ctx.body = {
    result: routePath
  }
})

module.exports = router
