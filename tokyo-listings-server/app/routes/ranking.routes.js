module.exports = app => {
  const ranking = require('../controllers/ranking.controller.js')

  var router = require('express').Router()

  router.post('/', ranking.create)
  router.get('/', ranking.findAll)
  router.put('/:id', ranking.update)
  router.delete('/:id', ranking.delete)

  app.use('/api/ranking', router)
}
