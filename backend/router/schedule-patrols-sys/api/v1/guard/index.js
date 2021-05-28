const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const router = require('koa-router')()
const ExcelJS = require('exceljs')

const tools = require('../../../../../utils/tools')
const db = tools.getDatabase()
const {Guard} = require(path.join(tools.rootPath(), 'models/index'))
const {genPatrolData} = require('../common')

function fixDate (orgDate) {
  return tools.fixEndsWith(orgDate.replace("/", "月"), '日')
}

function fixWeek (orgWeek) {
  return tools.fixStartsWith(orgWeek, '星期')
}

async function fmtToFtStruct (worksheet, mergeCurrent) {
  const columns = []
  const data = []
  const scroll = {x: 0, y: 390}

  let month = -1
  let dateIdx = -1
  let weekIdx = -1
  for (let i = 1; i <= worksheet.rowCount; ++i) {
    const row = worksheet.getRow(i)
    if (!columns.length) {
      for (let j = 1; j <= row.cellCount; ++j) {
        const cellVal = row.getCell(j).value
        if (cellVal === '日期') {
          columns.push({
            title: '日期',
            dataIndex: 'date',
            key: `${String.fromCharCode(64 + j)}${i}`,
            width: 80,
            index: j,
            fixed: 'left',
            scopedSlots: { customRender: 'date' }
          })
          dateIdx = j
          break
        }
      }
      if (!columns.length) {
        continue
      }
      for (let j = 1; j <= row.cellCount; ++j) {
        const cell = row.getCell(j)
        if (j === dateIdx) {
          continue
        }
        if (cell.value === '星期') {
          weekIdx = j
        } else {
          columns.push({
            title: cell.value,
            dataIndex: cell.value,
            key: `${String.fromCharCode(64 + j)}${i}`,
            width: 100,
            index: j
          })
        }
      }
      scroll.x = 80 + (columns.length - 1) * 100
      continue
    }
    let record = {
      key: i,
      date: fixDate(row.getCell(dateIdx).value),
      week: fixWeek(row.getCell(weekIdx).value)
    }
    if (month === -1) {
      month = record.date.match(new RegExp('^[0-9]+'))[0]
    }
    for (let j = 1; j <= row.cellCount; ++j) {
      const cell = row.getCell(j)
      if (j === dateIdx || j === weekIdx) {
        continue
      }
      const colDidx = _.find(columns, {index: j}).dataIndex
      record[colDidx] = cell.value || ''
    }
    data.push(record)
  }
  const result = {month, columns, data, scroll}
  if (!mergeCurrent) {
    await db.delete(Guard, {month})
  } else {
    // @_@
  }
  return db.save(Guard, result).then(newAry => newAry[0])
}

router.post('/file/upload', async ctx => {
  const file = ctx.request.files.file

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.read(fs.createReadStream(file.path))
  const worksheet = workbook.getWorksheet(1)

  const guard = await fmtToFtStruct(worksheet, ctx.query.isMergeCurrent)
  if (!JSON.parse(ctx.query.isAutoGene)) {
    ctx.body = {
      result: {guard}
    }
    return
  }
  const patrol = await genPatrolData(guard.month)
  ctx.body = {
    result: {
      guard, patrol
    }
  }
})

module.exports = router
