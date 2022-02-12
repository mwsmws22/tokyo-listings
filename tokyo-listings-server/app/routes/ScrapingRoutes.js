const router = require('express').Router()
const scraping = require('../controllers/scraping-controller')

module.exports = app => {
  router.get('/get/*', scraping.scrape)
  router.get('/check/*', scraping.scrapeCheck)

  app.use('/api/scrape', router)
}
