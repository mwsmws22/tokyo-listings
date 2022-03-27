const OneOffService = require('../services/OneOffService')
const DB = require('../models/DBModel')

const Property = DB.property
const Listing = DB.listing
const { Op } = DB.Sequelize

exports.getSuumoParamsHierarchy = (req, res, next) => {
  OneOffService.getSuumoParamsHierarchy()
    .then(output => {
      res.header('Content-Type', 'application/json')
      return res.send(JSON.stringify(output, null, 4))
    })
    .catch(next)
}

exports.getSuumoSearchUrlsForAllProperties = async (req, res, next) => {
  req.setTimeout(86400000)

  const properties = await Property.findAll({
    where: {
      prefecture: {
        [Op.eq]: '東京都'
      },
      interest: {
        [Op.eq]: req.params.interest
      }
    },
    include: [
      {
        model: Listing,
        attributes: ['square_m', 'url']
      }
    ]
  })

  properties
    .map(prop => async results => {
      const result = await OneOffService.getSuumoSearchUrlsForProperty(prop)
        .then(OneOffService.getSuumoListingsFromSearchResults)
        .then(OneOffService.removeSuumoArchivedListings)
        .then(OneOffService.findSuumoSimilarListings)
        .catch(err => console.log(err))
      if (result) {
        results.push(result)
      }
      return results
    })
    .reduce((prev, curr) => prev.then(curr), Promise.resolve([]))
    .then(results => {
      res.header('Content-Type', 'application/json')
      return res.send(JSON.stringify(results, null, 4))
    })
    .catch(next)
}

exports.getSuumoSearchUrlsForProperty = async (req, res, next) => {
  const property = await Property.findOne({
    where: {
      id: {
        [Op.eq]: req.params.propId
      }
    },
    include: [
      {
        model: Listing
      }
    ],
    order: [
      ['id', 'ASC'],
      [{ model: Listing, as: 'listings' }, 'availability', 'ASC']
    ]
  })

  await OneOffService.getSuumoSearchUrlsForProperty(property)
    .then(OneOffService.getSuumoListingsFromSearchResults)
    .then(OneOffService.removeSuumoArchivedListings)
    .then(OneOffService.findSuumoSimilarListings)
    .then(results => {
      res.header('Content-Type', 'application/json')
      return res.send(JSON.stringify(results, null, 4))
    })
    .catch(next)
}
