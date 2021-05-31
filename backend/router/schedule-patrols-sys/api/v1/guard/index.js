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

async function persistent (content, options) {
  let idCond = undefined
  console.log(options.mergeCurrent)
  if (!options.mergeCurrent) {
    await db.delete(Guard, {month: content.month})
  } else {
    const ress = await db.select(Guard, {month: content.month}, {ext: true})
    if (ress.length) {
      const current = ress[0]
      idCond = {id: current._id}
      // 调整列
      const cttCols = content.columns.map(column => column.dataIndex)
      for (const column of current.columns) {
        if (!cttCols.includes(column.dataIndex)) {
          content.columns.push(column)
        }
      }
      // 构建现存数据映射表
      const curDataMap = {}
      current.data.map(record => {
        curDataMap[record.date] = record
      })
      // 调整内容
      for (let i = 0; i < content.data.length; ++i) {
        const record = content.data[i]
        const curRcd = curDataMap[record.date]
        for (const column of content.columns) {
          const cdIdx = column.dataIndex
          if (!content.data[i][cdIdx] && curRcd[cdIdx]) {
            content.data[i][cdIdx] = curRcd[cdIdx]
          }
        }
      }
    }
  }
  return db.save(Guard, content, idCond).then(ress => ress[0])
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
            fixed: 'left'
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
          columns.push({
            title: '星期',
            dataIndex: 'week',
            key: `${String.fromCharCode(64 + j)}${i}`,
            width: 40,
            index: j,
            fixed: 'left'
          })
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
      scroll.x = 120 + (columns.length - 2) * 100
      continue
    }
    let record = {
      key: i,
      date: fixDate(row.getCell(dateIdx).value),
      week: row.getCell(weekIdx).value
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
  const result = await persistent({
    month, columns, data, scroll
  }, {mergeCurrent})
  return result
}

router.post('/file/upload', async ctx => {
  const file = ctx.request.files.file

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.read(fs.createReadStream(file.path))
  const worksheet = workbook.getWorksheet(1)

  const guard = await fmtToFtStruct(worksheet,
    JSON.parse(ctx.query.isMergeCurrent)
  )
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
