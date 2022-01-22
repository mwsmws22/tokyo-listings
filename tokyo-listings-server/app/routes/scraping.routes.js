module.exports = app => {
  const scraping = require('../controllers/scraping.controller.js')

  var router = require('express').Router()

  router.get('/get/*', scraping.scrape)
  router.get('/check/*', scraping.scrapeCheck)

  app.use('/api/scrape', router)
}
