const db = require('../databases/mongo')

module.exports = db.defineModel({
  __modelName: 'patrol',
  month: db.Types.Number,
  columns: db.Types.Array,
  data: db.Types.Array,
  scroll: {
    x: db.Types.Number,
    y: db.Types.Number
  },
  createdAt: db.Types.Date,
  updatedAt: db.Types.Date
}, {
  middle: {
    create: {
      before (doc) {
        if (!doc.createdAt) {
          doc.createdAt = Date.now()
        }
        doc.updatedAt = Date.now()
      }
    }
  },
  router: {
    methods: ['GET', 'ALL', 'PUT']
  }
})
