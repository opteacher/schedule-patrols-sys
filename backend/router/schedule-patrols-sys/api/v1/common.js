const _ = require('lodash')
const path = require('path')
const tools = require('../../../../utils/tools')
const db = tools.getDatabase()
const {Guard, Patrol} = require(path.join(tools.rootPath(), 'models/index'))

module.exports = {
  async genPatrolData (month) {
    const guard = (await db.select(Guard, {month}, {ext: true}))[0]
    // 判断中班组、值班组
    const groups = []
    const memSet = new Set()
    for (const record of guard.data) {
      const gpMems = []
      for (const key of Object.keys(record)) {
        if (key === 'date' || key === 'week'
        || key === 'key' || key === '所领导') {
          continue
        }
        if (record[key]) {
          const name = tools.rmvEndsOf(record[key], '\n（整）')
          gpMems.push(name)
          memSet.add(name)
        }
      }
      // 小于4个人，为中班
      const group = {
        date: record.date,
        week: record.week,
        afternoon: [],
        evening: [],
        yesterday: groups.length ? groups[groups.length - 1].evening : []
      }
      if (gpMems.length <= 4) {
        group.afternoon = group.afternoon.concat(gpMems)
      } else {
        group.evening = group.evening.concat(gpMems)
      }
      groups.push(group)
    }
    const members = {}
    for (const mem of memSet) {
      members[mem] = 0
    }
    
    // 排班
    const memAry = Array.from(memSet)
    const data = []
    let yesterday = []
    for (const group of groups) {
      const avaMems = memAry.filter(mem => {
        return !group.afternoon.includes(mem)
          && !group.evening.includes(mem)
          && !group.yesterday.includes(mem)
          && !yesterday.includes(mem)
      })
      // 执勤次数较低的成员
      let stdMems = _.sortBy(avaMems, mem => members[mem])
      const record = {
        key: group.date,
        date: group.date,
        week: group.week,
        east: [],
        west: [],
        norm: []
      }
      if (stdMems.length >= 3) {
        // 取末尾三个成员，并打乱顺序
        const selMems = _.shuffle(stdMems.slice(0, 3))
        const mem1 = selMems[0]
        const mem2 = selMems[1]
        const mem3 = selMems[2]
        record.east.push(mem1 + members[mem1])
        record.west.push(mem2 + members[mem2])
        record.norm.push(mem3 + members[mem3])
        members[mem1]++
        members[mem2]++
        members[mem3]++
        yesterday = [mem1, mem2, mem3]
      } else {
        yesterday = []
      }
      data.push(record)
    }
    
    const result = {
      month,
      columns: [{
        title: '日期',
        dataIndex: 'date',
        key: 'A',
        width: 80,
        fixed: 'left'
      }, {
        title: '星期',
        dataIndex: 'week',
        key: 'B',
        width: 40,
        fixed: 'left'
      },{
        title: '东片区巡逻',
        dataIndex: 'east',
        key: 'C',
        width: 100
      }, {
        title: '西片区巡逻',
        dataIndex: 'west',
        key: 'D',
        width: 100
      }, {
        title: '责任区平峰',
        dataIndex: 'norm',
        key: 'E',
        width: 100
      }],
      data,
      counts: members,
      scroll: {x: 380, y: 390}
    }
    await db.delete(Patrol, {month})
    return db.save(Patrol, result).then(newAry => newAry[0])
  }
}