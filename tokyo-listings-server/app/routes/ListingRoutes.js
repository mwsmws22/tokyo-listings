const router = require('express').Router()
const ListingController = require('../controllers/ListingController')

module.exports = app => {
  router.post('/', ListingController.create)
  router.get('/', ListingController.findAll)
  router.get('/interest/:interest', ListingController.findAllByInterest)
  router.post('/partialUrl/', ListingController.findAllByPartialUrl)
  router.post('/suumoBukken/', ListingController.getUpdatedSuumoBukkenUrls)
  router.post('/similarListings/', ListingController.findAllByParams)
  router.put('/:id', ListingController.update)
  router.delete('/:id', ListingController.delete)

  app.use('/api/listing', router)
}
