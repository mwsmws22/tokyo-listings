const router = require('express').Router()
const listing = require('../controllers/listing-controller')

module.exports = app => {
  router.post('/', listing.create)
  router.get('/', listing.findAll)
  router.get('/interest/:interest', listing.findAllByInterest)
  router.post('/partialUrl/', listing.findAllByPartialUrl)
  router.post('/suumoBukken/', listing.getUpdatedSuumoBukkenUrls)
  router.post('/similarListings/', listing.findAllByParams)
  router.put('/:id', listing.update)
  router.delete('/:id', listing.delete)

  app.use('/api/listing', router)
}
