const fs = require('fs')
const router = require('koa-router')()
const ExcelJS = require('exceljs')

router.post('/file/upload', async ctx => {
  const file = ctx.request.files.file

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.read(fs.createReadStream(file.path))
  const worksheet = workbook.getWorksheet(1)

  worksheet.eachRow((row, rowNum) => {
    console.log('Row', rowNum, ', Content: ', row.getCell('B').value)
    // @_@
  })

  ctx.body = {
    result: ''
  }
})

module.exports = router
