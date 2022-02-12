const router = require('express').Router()
const ScrapingController = require('../controllers/ScrapingController')

module.exports = app => {
  router.post('/detail/', ScrapingController.scrapeDetail)
  router.post('/check/', ScrapingController.scrapeCheck)

  app.use('/api/scrape', router)
}
