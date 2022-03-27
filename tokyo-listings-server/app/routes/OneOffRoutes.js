const router = require('express').Router()
const OneOffController = require('../controllers/OneOffController')

module.exports = app => {
  router.get('/suumoParams/', OneOffController.getSuumoParamsHierarchy)
  router.get(
    '/suumoSearchAll/:interest',
    OneOffController.getSuumoSearchUrlsForAllProperties
  )
  router.get('/suumoSearch/:propId', OneOffController.getSuumoSearchUrlsForProperty)

  app.use('/api/oneoff', router)
}
