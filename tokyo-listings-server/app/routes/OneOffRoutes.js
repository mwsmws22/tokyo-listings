const router = require('express').Router()
const OneOffController = require('../controllers/OneOffController')

module.exports = app => {
  router.get('/suumoParams/', OneOffController.getSuumoParamsHierarchy)
  router.get('/suumoUrls/', OneOffController.getSuumoSearchUrlsForAllProperties)

  app.use('/api/oneoff', router)
}
