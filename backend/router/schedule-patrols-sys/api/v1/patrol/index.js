const router = require('koa-router')()

const {genPatrolData} = require('../common')

router.post('/gene', async ctx => {
  const month = (new Date()).getMonth() + 1
  const patrol = await genPatrolData(month)
  ctx.body = {
    result: patrol
  }
})

module.exports = router
