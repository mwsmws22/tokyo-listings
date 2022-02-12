const router = require('express').Router()
const PropertyController = require('../controllers/PropertyController')

module.exports = app => {
  router.post('/', PropertyController.create)
  router.get('/', PropertyController.findAll)
  router.put('/:id', PropertyController.update)
  router.delete('/:id', PropertyController.delete)
  router.get('/withChildren/', PropertyController.findAllWithChildren)

  app.use('/api/property', router)
}
